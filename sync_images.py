#!/usr/bin/env python3
# 이미지 동기화 스크립트 — 사진 추가·교체 후 이거 하나만 실행하면 됨
#
#   python3 sync_images.py          # 압축 + index.html 갤러리 경로 자동 갱신
#   python3 sync_images.py --check  # 변경 없이 검사만 (큰 파일·깨진 경로 리포트)
#
# 하는 일:
#   1. 용량 큰 이미지를 sips(맥 내장)로 자동 압축 (원본은 덮어씀 — 원본 보관은
#      ../images_originals_backup 에 직접 복사해 둘 것)
#   2. images/gallery 의 실제 파일명(확장자·대소문자 포함)을 읽어
#      index.html 갤러리 섹션의 <img> 목록을 통째로 다시 씀
#      → N-main.*  : 각 섹션 메인 사진
#      → N-subM.*  : 각 섹션 서브 카드 (M 숫자 순서대로)
#   3. index.html 이 참조하는 모든 이미지가 실제로 있는지 검사
#
# 파일명 규칙: images/gallery/1-main.jpg, 1-sub1.JPG, 1-sub2.JPEG ...
#   확장자·대소문자는 아무래도 상관없음 (스크립트가 실제 파일명을 그대로 반영)

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent
IMAGES = ROOT / 'images'
HTML = ROOT / 'index.html'

# (대상 glob, 용량 한도 KB, 리샘플 최대 px, JPEG 품질)
COMPRESS_RULES = [
    ('gallery/*-main.*',   900, 2400, 78),   # 갤러리 메인: 풀스크린
    ('gallery/*-sub*.*',   300, 1000, 74),   # 갤러리 서브 카드: 화면엔 최대 280px로만 뜸
    ('main.jp*g',          900, 2400, 78),   # 히어로 poster (main.jpg/main.jpeg 둘 다 매칭)
    ('thumbnail.jpg',      500, 1600, 80),   # 카톡 og:image
    ('rsvp/groom.*',       500, 1200, 80),   # RSVP 프로필
    ('rsvp/bridal.*',      500, 1200, 80),
    ('highlights/*.png',  1500, 1200, None), # PNG는 리샘플만 (품질 옵션 없음) — 실사진이면 jpg로 바꾸는 게 훨씬 효율적
    ('highlights/*.jpg',   900, 1200, 78),
    ('highlights/*.jpeg',  900, 1200, 78),
    ('information/*.png', 1500, 1200, None), # 약도 등 안내 이미지

]
RETRY_SCALE, RETRY_Q = 0.75, 68   # 1차 압축 후에도 한도 초과면 규칙별 max_px의 75%로 더 강하게
IMG_EXT = re.compile(r'\.(jpe?g|png|webp)$', re.I)


def run_sips(path: Path, max_px: int, quality):
    cmd = ['sips', '--resampleHeightWidthMax', str(max_px)]
    if quality is not None:
        cmd += ['-s', 'format', 'jpeg', '-s', 'formatOptions', str(quality)]
    cmd.append(str(path))
    subprocess.run(cmd, capture_output=True, check=True)


def compress(check_only: bool) -> bool:
    ok = True
    for pattern, limit_kb, max_px, quality in COMPRESS_RULES:
        for f in sorted(IMAGES.glob(pattern)):
            if not IMG_EXT.search(f.name):
                continue
            kb = f.stat().st_size // 1024
            if kb <= limit_kb:
                continue
            if check_only:
                print(f'[검사] 용량 초과: {f.relative_to(ROOT)} ({kb}KB > {limit_kb}KB)')
                ok = False
                continue
            run_sips(f, max_px, quality)
            new_kb = f.stat().st_size // 1024
            if new_kb > limit_kb and quality is not None:   # 디테일 많은 사진 재시도
                run_sips(f, int(max_px * RETRY_SCALE), RETRY_Q)
                new_kb = f.stat().st_size // 1024
            print(f'[압축] {f.relative_to(ROOT)}: {kb}KB → {new_kb}KB')
    return ok


def gallery_files():
    """섹션 번호 → (메인 파일명, [서브 파일명 숫자순]) 매핑."""
    sections = {}
    for f in IMAGES.glob('gallery/*'):
        m = re.match(r'^(\d+)-main\.(jpe?g)$', f.name, re.I)
        if m:
            sections.setdefault(int(m.group(1)), {})['main'] = f.name
            continue
        m = re.match(r'^(\d+)-sub(\d+)\.(jpe?g)$', f.name, re.I)
        if m:
            sections.setdefault(int(m.group(1)), {}).setdefault('subs', []).append(
                (int(m.group(2)), f.name))
    for sec in sections.values():
        sec['subs'] = [name for _, name in sorted(sec.get('subs', []))]
    return dict(sorted(sections.items()))


def sync_html(check_only: bool) -> bool:
    html = HTML.read_text(encoding='utf-8')
    sections = gallery_files()

    # index.html 의 갤러리(.dress) 섹션들을 문서 순서 = 섹션 번호 순서로 매칭
    dress_blocks = list(re.finditer(
        r'<section class="dress">.*?</section>', html, re.S))
    nums = list(sections.keys())
    if len(dress_blocks) != len(nums):
        print(f'[경고] 갤러리 폴더 섹션 수({len(nums)})와 index.html 섹션 수'
              f'({len(dress_blocks)})가 다름 — 섹션 추가/삭제는 수동으로 할 것')
        nums = nums[:len(dress_blocks)]

    changed = False
    out = html
    for block, n in zip(dress_blocks, nums):
        sec, text = sections[n], block.group(0)
        new_text = text
        if 'main' in sec:   # 메인 사진 src 교체
            new_text = re.sub(
                r'(src="\./images/gallery/)[^"]+(" alt="갤러리)',
                rf'\g<1>{sec["main"]}\g<2>', new_text)
        imgs = '\n'.join(
            f'        <img loading="lazy" decoding="async" src="./images/gallery/{name}" alt="" />'
            for name in sec['subs'])
        new_text = re.sub(   # .cards 안 서브 이미지 목록 통째로 재생성
            r'(<div class="cards">\n).*?(\n      </div>)',
            rf'\g<1>{imgs}\g<2>', new_text, flags=re.S)
        if new_text != text:
            changed = True
            print(f'[갱신] 갤러리 {n}꼭지: 메인={sec.get("main", "?")}, '
                  f'서브 {len(sec["subs"])}장')
            out = out.replace(text, new_text)

    if changed and not check_only:
        HTML.write_text(out, encoding='utf-8')
    elif changed and check_only:
        print('[검사] index.html 갱신 필요 (--check 없이 다시 실행)')

    # 참조 무결성 검사 (map.jpg 는 onerror 플레이스홀더가 있어 예외)
    ok = not (changed and check_only)
    final = out if not check_only else html
    for ref in sorted(set(re.findall(r'\./images/[^"]+', final))):
        p = ROOT / ref[2:]
        if not p.exists() and p.name != 'map.jpg':
            print(f'[오류] index.html 이 참조하는 파일 없음: {ref}')
            ok = False
    return ok


if __name__ == '__main__':
    check = '--check' in sys.argv
    ok = compress(check)
    ok = sync_html(check) and ok
    print('✅ 문제 없음' if ok else '⚠️ 위 항목 확인 필요')
    sys.exit(0 if ok else 1)
