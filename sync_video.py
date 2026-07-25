#!/usr/bin/env python3
# 히어로 영상 동기화 스크립트 — 새 영상(.mov) 넣은 뒤 이거 하나만 실행하면 됨
#
#   python3 sync_video.py           # images/ 안의 .mov → 720p .mp4 변환 + index.html 갱신
#   python3 sync_video.py --check   # 변경 없이 검사만
#
# 하는 일:
#   1. images/ 바로 아래의 .mov 파일을 찾아 맥 내장 avconvert로
#      모바일용 mp4(세로 720×1280, H.264)로 변환
#   2. 변환 후 원본 .mov는 ../images_originals_backup/ 으로 이동 (git 용량 보호)
#   3. index.html 히어로 <video src="...">를 변환된 파일로 갱신
#   4. 결과 용량이 크면 경고 (10MB 초과 → 영상 길이를 줄이는 걸 권장)

import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent
IMAGES = ROOT / 'images'
HTML = ROOT / 'index.html'
BACKUP = ROOT.parent / 'images_originals_backup'
PRESET = 'Preset1280x720'      # 세로 영상이면 720×1280으로 나옴
WARN_MB = 10                   # 이 이상이면 경고


def find_mov():
    movs = [f for f in IMAGES.iterdir() if f.suffix.lower() == '.mov']
    if len(movs) > 1:
        print(f'[오류] .mov가 여러 개임: {[f.name for f in movs]} — 하나만 남길 것')
        sys.exit(1)
    return movs[0] if movs else None


def convert(mov: Path) -> Path:
    out = mov.with_name(mov.stem.lower() + '.mp4')
    print(f'[변환] {mov.name} → {out.name} ({PRESET}) ...')
    subprocess.run(
        ['avconvert', '--preset', PRESET, '--source', str(mov),
         '--output', str(out), '--replace'],
        capture_output=True, check=True)
    mb = out.stat().st_size / 1024 / 1024
    print(f'[변환] 완료: {out.name} = {mb:.1f}MB')
    if mb > WARN_MB:
        print(f'[경고] {WARN_MB}MB 초과 — 영상을 10초 안팎으로 자르는 걸 권장')
    return out


def update_html(mp4: Path, check_only: bool) -> bool:
    html = HTML.read_text(encoding='utf-8')
    new_html, n = re.subn(
        r'(<video src="\./images/)[^"]+(")',
        rf'\g<1>{mp4.name}\g<2>', html)
    if n == 0:
        print('[오류] index.html에서 히어로 <video> 태그를 못 찾음')
        return False
    if new_html != html:
        if check_only:
            print(f'[검사] index.html의 video src 갱신 필요 → {mp4.name}')
            return False
        HTML.write_text(new_html, encoding='utf-8')
        print(f'[갱신] index.html video src → ./images/{mp4.name}')
    return True


if __name__ == '__main__':
    check = '--check' in sys.argv
    mov = find_mov()

    if mov is None:
        # 새 .mov 없음 → 기존 mp4와 HTML이 맞는지만 검사
        mp4s = [f for f in IMAGES.iterdir() if f.suffix.lower() == '.mp4']
        if not mp4s:
            print('[오류] images/ 에 영상 파일(.mov/.mp4)이 없음')
            sys.exit(1)
        ok = update_html(mp4s[0], check)
        print('✅ 문제 없음' if ok else '⚠️ 위 항목 확인 필요')
        sys.exit(0 if ok else 1)

    if check:
        print(f'[검사] 변환 대기 중인 원본 있음: {mov.name} '
              f'({mov.stat().st_size / 1024 / 1024:.1f}MB) — --check 없이 실행할 것')
        sys.exit(1)

    mp4 = convert(mov)
    BACKUP.mkdir(exist_ok=True)
    shutil.move(str(mov), BACKUP / mov.name)   # 같은 이름 있으면 덮어씀
    print(f'[백업] 원본 이동: {BACKUP / mov.name}')
    ok = update_html(mp4, check)
    print('✅ 문제 없음' if ok else '⚠️ 위 항목 확인 필요')
    sys.exit(0 if ok else 1)
