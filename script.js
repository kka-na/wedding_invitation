/* ==========================================================
   설정 — 이 블록만 수정하면 됨
   ========================================================== */
const CONFIG = {
  // 히어로 영상 자동재생 여부 — false면 영상 재생 없이 바로 main.jpeg 사진으로 표시
  HERO_VIDEO_ENABLED: false,
  // 히어로 타이틀 문구
  HERO_TITLE: '깜짝 빛날 시간.',
  // 타이틀 아래 날짜/장소 한 줄
  HERO_DETAIL: '10월 25일 오후 12시 30분,\n코엑스 아셈볼룸에서 웨딩 마치.',

  // RSVP 백엔드 → 구글 스프레드시트(Apps Script 웹앱)로 연결.
  // server/rsvp-apps-script.gs 를 스프레드시트에 배포하고 나온 웹 앱 URL(…/exec)을 아래에 붙여넣을 것.
  API_URL: 'https://script.google.com/macros/s/AKfycbwIPasZAYT39n84NBOF43dSRs6rThM4AO5kbXJ6NOMeB75-x3N9oCjz72arYONQdI_y/exec',

  WEDDING_DATE: '2026-10-25T12:30:00+09:00',

  VENUE_NAME: '코엑스 아셈볼룸',
  VENUE_ADDR: '강남구 영동대로 513 코엑스 2층',
  NAVER_MAP_URL: 'https://naver.me/FMcvEUZS',
  KAKAO_MAP_URL: 'https://place.map.kakao.com/1151703248',
  TMAP_MAP_URL: 'https://tmap.life/f380ecf6',
  COEX_GUIDE_URL: 'https://www.coex.co.kr/guide/directions/',

  // [발급 후 입력] 네이버클라우드 Maps API 키 (Web Dynamic Map의 Client ID)
  // 발급 전까지는 빈 문자열 유지 → 약도 이미지(map.png)가 표시됨
  NAVER_MAP_CLIENT_ID: 'wve9i9ups2',
  VENUE_LAT: 37.5128403,   // 코엑스 아셈볼룸 (네이버 지도 공식 좌표)
  VENUE_LNG: 127.0586859,

  // [미정] 은행명·계좌번호 확정되면 아래 6줄 교체
  ACCOUNTS: {
    groom: [
      { who: '신랑', name: '한형진', bank: '은행명', num: '000-0000-0000' },
      { who: '아버지', name: '한정수', bank: '은행명', num: '000-0000-0000' },
      { who: '어머니', name: '권정미', bank: '은행명', num: '000-0000-0000' },
    ],
    bride: [
      { who: '신부', name: '김가나', bank: '은행명', num: '000-0000-0000' },
      { who: '아버지', name: '김창선', bank: '은행명', num: '000-0000-0000' },
      { who: '어머니', name: '조경미', bank: '은행명', num: '000-0000-0000' },
    ],
  },
};
/* ========================================================== */

/* ---------- 히어로 바로가기 버튼: D-7부터 표시 ---------- */
(function () {
  const cta = document.querySelector('.hero-cta');
  if (!cta) return;
  const remain = new Date(CONFIG.WEDDING_DATE) - Date.now();
  if (remain <= 7 * 24 * 60 * 60 * 1000) cta.classList.add('show');
})();

/* ---------- 히어로 영상 종료 → 스틸 사진 크로스페이드 ---------- */
(function () {
  const v = document.querySelector('#hero > video');
  const still = document.querySelector('#hero .hero-still');
  if (!v || !still) return;
  const toPhoto = () => {            /* 사진 모드 전환: 스틸 페이드인 + 글자색 전환 */
    still.classList.add('show');
    document.getElementById('hero').classList.add('photo');
  };
  if (!CONFIG.HERO_VIDEO_ENABLED) {  /* 영상 비활성화: 재생 없이 바로 사진 모드 */
    toPhoto();
    return;
  }
  v.addEventListener('ended', () => {
    toPhoto();
    setTimeout(() => v.pause(), 2000);   /* 페이드 완료 후 영상 정지 (배터리 절약) */
  });
  /* 자동재생이 차단된 경우(저전력 모드 등)에도 스틸 사진으로 자연스럽게 */
  v.play().catch(toPhoto);
})();

/* ---------- 설정값 주입 ---------- */
document.getElementById('hero-title').textContent = CONFIG.HERO_TITLE;
document.getElementById('hero-detail').textContent = CONFIG.HERO_DETAIL;
document.getElementById('venue-name').textContent = CONFIG.VENUE_NAME;
document.getElementById('venue-addr').textContent = CONFIG.VENUE_ADDR;
document.getElementById('link-naver').href = CONFIG.NAVER_MAP_URL;
document.getElementById('link-kakao').href = CONFIG.KAKAO_MAP_URL;
document.getElementById('link-tmap').href = CONFIG.TMAP_MAP_URL;
document.getElementById('link-coex').href = CONFIG.COEX_GUIDE_URL;

/* ---------- 캘린더에 추가하기: 애플 기기는 .ics, 그 외는 구글 캘린더 링크 ---------- */
(function () {
  const btn = document.getElementById('hero-calendar-btn');
  const start = new Date(CONFIG.WEDDING_DATE);
  const end = new Date(start.getTime() + 60 * 60 * 1000);   // 예식 1시간으로 가정
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const title = '형진 ♥ 가나 결혼식';
  const location = CONFIG.VENUE_NAME + ' (' + CONFIG.VENUE_ADDR + ')';
  const details = '형진과 가나의 결혼식에 초대합니다.';

  function buildICS() {
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding//KR',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '@wedding',
      'DTSTAMP:' + fmt(new Date()),
      'DTSTART:' + fmt(start),
      'DTEND:' + fmt(end),
      'SUMMARY:' + title,
      'LOCATION:' + location,
      'DESCRIPTION:' + details,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
  }
  function buildGoogleUrl() {
    const params = new URLSearchParams({
      action: 'TEMPLATE', text: title,
      dates: fmt(start) + '/' + fmt(end),
      location, details,
    });
    return 'https://calendar.google.com/calendar/render?' + params.toString();
  }

  function downloadICS() {
    // 크롬은 top-frame의 data: URL 이동을 보안상 막아서 location.href 방식은 조용히
    // 실패한다. blob 다운로드는 데스크톱·모바일 브라우저에서 공통으로 동작하고,
    // iOS/macOS에서는 받은 .ics 파일을 열면 캘린더 앱이 바로 인식한다.
    const blob = new Blob([buildICS()], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wedding.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  btn.addEventListener('click', () => {
    const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
    if (isApple) {
      downloadICS();
    } else {
      window.open(buildGoogleUrl(), '_blank');
    }
  });
})();

/* ---------- 네이버 지도 (키가 입력된 경우에만 로드) ---------- */
(function () {
  if (!CONFIG.NAVER_MAP_CLIENT_ID) return;   // 키 없으면 약도 이미지 유지
  const s = document.createElement('script');
  s.src = 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=' + CONFIG.NAVER_MAP_CLIENT_ID;
  s.onload = () => {
    const el = document.getElementById('naver-map');
    el.style.display = 'block';
    document.getElementById('map-img').style.display = 'none';
    const pos = new naver.maps.LatLng(CONFIG.VENUE_LAT, CONFIG.VENUE_LNG);
    const map = new naver.maps.Map(el, {
      center: pos, zoom: 16,
      scrollWheel: false,                    // 페이지 스크롤 방해 방지
    });
    /* 커스텀 마커: '아셈볼룸' 라벨 알약 + 꼬리 (탭하면 네이버 지도 열림) */
    const marker = new naver.maps.Marker({
      position: pos, map,
      icon: {
        content: '<div class="nmarker">2층 아셈볼룸<i></i></div>',
        anchor: new naver.maps.Point(0, 0),
      },
    });
    naver.maps.Event.addListener(marker, 'click',
      () => window.open(CONFIG.NAVER_MAP_URL, '_blank'));
  };
  document.head.appendChild(s);
})();

/* ---------- 히어로: 스크롤 블러 ---------- */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    const v = document.querySelector('#hero > video');   /* 모션 최소화 설정 시 영상 정지 + 사진 모드 */
    if (v) { v.pause(); v.removeAttribute('autoplay'); }
    const still = document.querySelector('#hero .hero-still');
    if (still) still.classList.add('show');
    document.getElementById('hero').classList.add('photo');
    return;
  }
  const heroMedia = document.querySelectorAll('#hero > video, #hero > img');
  const MAX_BLUR = 10;   // 필터 블러 강도 (px) — 16→10으로 낮춰 GPU 부담 완화
  let ticking = false;
  function update() {
    const vh = window.innerHeight;
    const hp = Math.min(1, Math.max(0, window.scrollY / vh));
    heroMedia.forEach(el => {
      el.style.filter = 'blur(' + (hp * MAX_BLUR).toFixed(1) + 'px)';
      el.style.transform = 'scale(' + (1 + hp * 0.06).toFixed(3) + ')';
    });
  }
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }, { passive: true });
  update();
})();

/* ---------- 드레스 섹션: 스크롤 고정(pin) + 블러 (GSAP ScrollTrigger) ----------
   CSS position:sticky 대신 쓰는 이유: 200vh 구간 5개가 연달아 이어질 때
   스크롤 방향을 경계에서 바꾸면 브라우저가 sticky 위치를 잘못 재계산해서
   위/아래 섹션으로 튀는 버그가 있음 (특히 iOS Safari). GSAP이 JS로 직접
   고정/해제를 관리해서 이 문제를 피한다. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  // 안드로이드 크롬은 스크롤 방향에 따라 주소창이 접혔다 펼쳐지며 뷰포트 높이가
  // 수시로 바뀌는데, 이때마다 자동으로 리프레시하면 핀 구간 재계산이 스크롤 중에
  // 끼어들어 튕기는 원인이 된다. 아래 커스텀 리스너로 리프레시 시점을 직접
  // 제어하므로 GSAP 자체의 모바일 리사이즈 자동 리프레시는 꺼둔다.
  ScrollTrigger.config({ ignoreMobileResize: true });
  const MAX_BLUR = 10;
  const dressSections = Array.from(document.querySelectorAll('.dress'));

  // 갤러리 진행 인디케이터: 지금 몇 번째 이야기인지 보여줘서 뒤에 더 있다는 걸 알린다
  const pager = document.getElementById('dress-pager');
  const dotColors = ['var(--primary)', 'var(--secondary)', 'var(--third)', 'var(--fourth)', 'var(--fifth)'];
  const dots = dressSections.map((_, i) => {
    const d = document.createElement('span');
    d.className = 'dot';
    d.style.setProperty('--dot-color', dotColors[i] || '#fff');
    pager.appendChild(d);
    return d;
  });
  function setActiveDot(i) {
    dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
  }
  dressSections.forEach((sec, i) => {
    const sticky = sec.querySelector('.dress-sticky');
    const img = sec.querySelector('.dress-sticky > img');
    const cards = sec.querySelector('.cards');
    ScrollTrigger.create({
      trigger: sec,
      start: 'top top',
      end: '+=90%',           // 뷰포트 높이의 90%만큼 스크롤하는 동안 고정 (기존 115%보다 단축)
      pin: sticky,
      scrub: true,
      // 인디케이터는 endTrigger로 별도 구간을 잡는 대신, 5개 섹션 각각의 활성 상태를
      // 그대로 따라가게 한다 (endTrigger 기반 트리거는 핀 스페이싱 계산 순서 때문에
      // 구간이 어긋나 4·5번째 섹션에서 아예 표시되지 않는 버그가 있었음)
      onToggle(self) {
        pager.classList.toggle('show', self.isActive);
        if (self.isActive) setActiveDot(i);
      },
      onUpdate(self) {
        const p = self.progress;   // 0→1, 고정 구간을 지나는 동안
        const bp = Math.min(1, Math.max(0, (p - 0.15) / 0.85));   // 블러는 15% 지점부터 시작
        if (img) {
          img.style.filter = 'blur(' + (bp * MAX_BLUR).toFixed(1) + 'px)';
          img.style.transform = 'scale(' + (1 + bp * 0.06).toFixed(3) + ')';
        }
        if (cards) {   // 서브 카드: 블러가 진행되면 아래에서 떠오름 (p 0.25 지점부터, 투명도 없이 바로 사진으로 등장)
          const q = Math.min(1, Math.max(0, (p - 0.25) / 0.6));
          cards.style.opacity = q > 0 ? 1 : 0;
          cards.style.transform = 'translateY(' + ((1 - q) * 48).toFixed(1) + 'px)';
        }
      },
    });
  });
  // 5개 섹션의 고정(pin) 구간을 전부 만든 뒤에 다시 계산해야, 앞 섹션이 만든 여백이
  // 뒤 섹션의 시작/끝 위치 계산에 반영된다 (안 하면 카드가 갑자기 사라졌다 나타남)
  ScrollTrigger.refresh();

  // 새로고침한 시점에 주소창이 펼쳐져 있으면(화면이 작음) 방금 그 refresh()가
  // 작은 화면 기준으로 핀 구간 길이를 계산해버려서, 이후 주소창이 접혀 화면이
  // 커져도 잘못된(너무 짧은) 값으로 고정돼버리는 문제가 있었다. 주소창이 처음
  // 한 번 움직이는 시점(보통 첫 스크롤 직후)에 딱 한 번만 안전하게 다시
  // 계산해서 바로잡고, 그 이후로는 더 이상 개입하지 않는다 — 반복 재계산은
  // 스크롤 중 화면이 엉뚱한 곳으로 튀는 훨씬 심각한 버그의 원인이었다 (아래 참고).
  let settled = false;
  function trySettle() {
    if (settled) return;
    const midPin = ScrollTrigger.getAll().some(t => t.pin && t.isActive);
    if (midPin) { setTimeout(trySettle, 200); return; }   // 핀 걸린 도중이면 잠깐 미뤘다 재시도
    settled = true;
    window.removeEventListener('resize', onFirstViewportChange);
    if (window.visualViewport) window.visualViewport.removeEventListener('resize', onFirstViewportChange);
    ScrollTrigger.refresh();
  }
  function onFirstViewportChange() { setTimeout(trySettle, 300); }   // 주소창 애니메이션이 끝날 시간을 줌
  window.addEventListener('resize', onFirstViewportChange);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onFirstViewportChange);

  // 예전엔 여기서 주소창 접힘/펼침(visualViewport resize)마다 ScrollTrigger.refresh()를
  // 걸었는데, 핀이 걸린 채 스크롤 중에 재계산이 끼어들면 구간 전체 위치가 바뀌면서
  // 화면이 엉뚱한 곳(첫 화면 등)으로 튀는 훨씬 심각한 버그를 만들었다. 위의
  // ignoreMobileResize 설정이 주소창 토글로 인한 리사이즈는 이미 무시해주므로,
  // 실제 기기 회전처럼 가로폭이 바뀌는 경우에만 다시 계산한다.
  let resizeTimer;
  let vvW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === vvW) return;   // 세로 크기만 바뀌는 건 주소창 토글 — 무시
    vvW = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
  });
})();

/* ---------- 하이라이트 카드 인디케이터 ---------- */
(function () {
  const track = document.querySelector('.hl-cards');
  const pager = document.getElementById('hl-pager');
  const cards = Array.from(track.querySelectorAll('.hl-card'));
  if (!cards.length) return;
  const dots = cards.map((c, i) => {
    const d = document.createElement('button');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', (i + 1) + '번째 카드');
    d.onclick = () => track.scrollTo({
      left: c.offsetLeft - (track.clientWidth - c.clientWidth) / 2,
      behavior: 'smooth'
    });
    pager.appendChild(d);
    return d;
  });
  let t;
  track.addEventListener('scroll', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bd = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - center);
        if (d < bd) { bd = d; best = i; }
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === best));
    }, 60);
  }, { passive: true });
})();

/* ---------- 오시는 길 카드: 이전/다음 버튼 ---------- */
(function () {
  const track = document.getElementById('loc-cards');
  const prev = document.getElementById('loc-prev');
  const next = document.getElementById('loc-next');
  const cards = Array.from(track.querySelectorAll('.loc-card'));
  function nearest() {
    const c = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bd = Infinity;
    cards.forEach((el, i) => {
      const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - c);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  function goTo(i) {
    const el = cards[i];
    track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.clientWidth) / 2, behavior: 'smooth' });
  }
  prev.onclick = () => goTo(Math.max(0, nearest() - 1));
  next.onclick = () => goTo(Math.min(cards.length - 1, nearest() + 1));
  let t;
  track.addEventListener('scroll', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const i = nearest();
      prev.disabled = i === 0;
      next.disabled = i === cards.length - 1;
    }, 60);
  }, { passive: true });
})();

/* ---------- 플로팅 바로가기: 하이라이트~오시는 길 구간에서만 표시 ---------- */
(function () {
  const cta = document.getElementById('goto-location');
  const hl = document.getElementById('highlights');
  const loc = document.getElementById('location');
  function check() {
    const vh = window.innerHeight;
    const passedHl = hl.getBoundingClientRect().top < vh * 0.5;   // 하이라이트 도달
    const beforeLoc = loc.getBoundingClientRect().top > vh * 0.6; // 아직 오시는 길 전
    cta.classList.toggle('show', passedHl && beforeLoc);
  }
  let ctaTicking = false;
  window.addEventListener('scroll', () => {
    if (!ctaTicking) { ctaTicking = true; requestAnimationFrame(() => { ctaTicking = false; check(); }); }
  }, { passive: true });
  check();
})();

/* ---------- 이미지 저장·복사 방지 (우클릭·드래그 차단) ---------- */
document.addEventListener('contextmenu', e => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});
document.addEventListener('dragstart', e => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});

/* ---------- 갤러리 카드 확대 보기 ---------- */
/* 라이트박스 열려있는 동안 뒤 페이지 스크롤 잠금.
   (body를 position:fixed로 옮기는 방식은 스크롤 위치가 살짝 튀는 부작용이 있어서
   그냥 스크롤 자체를 막는 overflow:hidden만 사용 — 위치를 전혀 건드리지 않음) */
function lockBodyScroll() {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}
function unlockBodyScroll() {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('show');
  unlockBodyScroll();
}
(function () {
  const lb = document.getElementById('lightbox');
  const stage = document.getElementById('lb-stage');
  const track = document.getElementById('lb-track');
  const prevBtn = document.getElementById('lb-prev');
  const nextBtn = document.getElementById('lb-next');
  const dotsEl = document.getElementById('lb-dots');
  let dotEls = [];
  function buildDots() {
    dotsEl.innerHTML = '';
    dotEls = list.map(() => {
      const d = document.createElement('span');
      d.className = 'dot';
      dotsEl.appendChild(d);
      return d;
    });
  }
  const slideImgs = {
    prev: track.querySelector('img[data-role="prev"]'),
    current: track.querySelector('img[data-role="current"]'),
    next: track.querySelector('img[data-role="next"]'),
  };
  let list = [], idx = 0, animating = false, gen = 0;

  // 3패널 트랙(이전|현재|다음, 각 칸 33.3333%) 좌표 상수 — 각 칸이 화면 전체를 차지하도록
  // 가운데 칸(현재 사진)이 보이는 기준 위치가 REST_X
  const REST_X = -33.3333, NEXT_X = -66.6667, PREV_X = 0;
  function setTrackX(x) { track.style.transform = 'translateX(' + x + '%)'; }
  function snapTrackTo(x) {   // 트랜지션 없이 순간 이동
    track.classList.add('dragging');
    setTrackX(x);
    track.offsetHeight;   // 강제 리플로우
    track.classList.remove('dragging');
  }

  function loopIndex(i) {
    return ((i % list.length) + list.length) % list.length;
  }
  // 현재 사진의 실제 가로세로 비율에 맞춰 스테이지 박스 크기를 재조정 (버튼이 사진 바로 아래에 붙도록)
  function fitStage() {
    const im = slideImgs.current;
    const apply = () => {
      if (!im.naturalWidth || !im.naturalHeight) return;
      const maxW = window.innerWidth * 0.94;
      const maxH = window.innerHeight * 0.7;
      const ratio = im.naturalWidth / im.naturalHeight;
      let w = maxW, h = w / ratio;
      if (h > maxH) { h = maxH; w = h * ratio; }
      stage.style.width = w + 'px';
      stage.style.height = h + 'px';
    };
    if (im.complete) apply();
    else im.addEventListener('load', apply, { once: true });
  }
  // 사진 확대(핀치줌) 상태 — 브라우저 자체 페이지 확대 대신, 현재 사진에만
  // transform으로 확대/이동을 적용 (고정 오버레이가 브라우저 뷰포트 확대와
  // 충돌해 화면 밖으로 밀려나는 문제를 피하기 위함)
  const MIN_SCALE = 1, MAX_SCALE = 4;
  let scale = 1, panX = 0, panY = 0;
  function applyImgTransform() {
    slideImgs.current.style.transform = scale === 1 && panX === 0 && panY === 0
      ? '' : 'translate(' + panX + 'px,' + panY + 'px) scale(' + scale + ')';
  }
  function resetZoom() {
    scale = 1; panX = 0; panY = 0;
    slideImgs.current.style.transform = '';
  }

  function setSlides() {
    resetZoom();   // 다른 사진으로 넘어가면 확대 상태 초기화
    slideImgs.prev.src = list[loopIndex(idx - 1)];
    slideImgs.current.src = list[idx];
    slideImgs.next.src = list[loopIndex(idx + 1)];
    fitStage();
    if (dotEls.length !== list.length) buildDots();
    dotEls.forEach((d, i) => d.classList.toggle('active', i === idx));
  }
  function open(startIdx) {
    gen++;              // 새 세션 시작 → 이전에 진행 중이던 슬라이드 애니메이션 콜백을 무효화
    animating = false;
    idx = loopIndex(startIdx);
    snapTrackTo(REST_X);
    setSlides();
    lb.classList.add('show');
    lockBodyScroll();
  }

  // 카드 탭 → 해당 섹션 사진 목록으로 열기
  document.querySelectorAll('.cards').forEach(cardTrack => {
    cardTrack.addEventListener('click', e => {
      if (e.target.tagName !== 'IMG') return;
      e.stopPropagation();
      const cardImgs = Array.from(cardTrack.querySelectorAll('img'));
      list = cardImgs.map(im => im.src);
      open(cardImgs.indexOf(e.target));
    });
  });

  // 옆 칸으로 트랙을 슬라이드시킨 뒤, 이미지만 갱신하고 순간적으로 가운데로 복귀 (무한 루프처럼 보이게)
  function slideTo(dir) {
    if (animating || list.length < 2) return;
    animating = true;
    const myGen = gen;
    setTrackX(dir === 1 ? NEXT_X : PREV_X);
    track.addEventListener('transitionend', function onEnd() {
      track.removeEventListener('transitionend', onEnd);
      if (myGen !== gen) return;   // 그 사이 라이트박스가 닫혔다 다른 사진으로 다시 열렸으면 무시
      idx = loopIndex(idx + dir);
      setSlides();
      snapTrackTo(REST_X);
      animating = false;
    }, { once: true });
  }

  prevBtn.addEventListener('click', e => { e.stopPropagation(); slideTo(-1); });
  nextBtn.addEventListener('click', e => { e.stopPropagation(); slideTo(1); });

  // 제스처 처리: 손가락 1개면 (확대 안 된 상태) 좌우 스와이프로 이전/다음,
  // (확대된 상태) 사진 이동. 손가락 2개면 핀치줌 — 사진에만 확대를 적용하고
  // 브라우저 자체 페이지 확대는 쓰지 않는다 (touch-action:none, 아래 CSS 참고).
  const pointers = new Map();   // pointerId → 현재 좌표
  let sx = 0, swiped = false, primaryPointerId = null, pinched = false;
  let dragging = false, dragDx = 0;
  let panning = false, panPointerId = null, panStartClientX = 0, panStartClientY = 0, panStartX0 = 0, panStartY0 = 0;
  let pinchStartDist = 1, pinchStartScale = 1;

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function beginPinch() {
    const [a, b] = [...pointers.values()];
    pinchStartDist = dist(a, b) || 1;
    pinchStartScale = scale;
    panX = 0; panY = 0;   // 이전에 한 손가락으로 이동시켰던 값이 남아있으면 중심이 어긋나 보이므로 초기화
    applyImgTransform();
  }
  function beginPan(pointerId, x, y) {
    panning = true;
    panPointerId = pointerId;
    panStartClientX = x; panStartClientY = y;
    panStartX0 = panX; panStartY0 = panY;
  }

  lb.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size >= 2) {
      pinched = true;
      if (dragging) { dragging = false; snapTrackTo(REST_X); }
      panning = false;
      beginPinch();
    } else {
      primaryPointerId = e.pointerId;
      sx = e.clientX;
      swiped = false;
      pinched = false;
      if (scale > 1.01) {
        beginPan(e.pointerId, e.clientX, e.clientY);
      } else if (!animating && list.length > 1) {
        dragging = true;
        dragDx = 0;
        track.classList.add('dragging');   // 드래그 중엔 트랜지션 끄고 손가락에 즉시 반응
      }
    }
  });
  lb.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchStartScale * (dist(a, b) / pinchStartDist)));
      applyImgTransform();   // 위치는 그대로 두고 확대/축소만 반영
      return;
    }
    if (panning && e.pointerId === panPointerId) {
      panX = panStartX0 + (e.clientX - panStartClientX);
      panY = panStartY0 + (e.clientY - panStartClientY);
      applyImgTransform();
      return;
    }
    if (!dragging || e.pointerId !== primaryPointerId) return;
    dragDx = e.clientX - sx;
    const stageW = stage.getBoundingClientRect().width || window.innerWidth;
    const raw = REST_X + (dragDx / stageW) * -REST_X;   // 드래그 거리를 트랙 좌표계로 환산
    setTrackX(Math.max(NEXT_X, Math.min(PREV_X, raw)));   // 옆 칸을 넘어서까지 끌리지 않게 제한
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);

    if (panning && e.pointerId === panPointerId) { panning = false; panPointerId = null; }

    if (pointers.size === 1) {
      // 핀치 도중 손가락 하나를 뗌 → 남은 손가락으로 이동(pan) 이어가기
      const [[pid, pos]] = pointers.entries();
      primaryPointerId = pid;
      if (scale > 1.01) beginPan(pid, pos.x, pos.y);
      return;
    }
    if (pointers.size > 1) return;   // 세 손가락 이상이었다가 하나만 뗀 경우 등은 무시

    // 손가락이 전부 떨어짐
    primaryPointerId = null;
    if (scale <= 1.01) resetZoom();   // 원래 크기 근처면 완전히 초기화
    if (pinched) return;              // 핀치가 있었던 제스처의 탭/클릭은 무시 (스와이프 판정 안 함)
    if (!dragging) return;
    dragging = false;
    track.classList.remove('dragging');   // 트랜지션 다시 켬 → 이어서 부드럽게 완료/복귀
    const dx = dragDx;
    dragDx = 0;
    if (Math.abs(dx) > 40 && list.length > 1) {
      swiped = true;
      slideTo(dx < 0 ? 1 : -1);
    } else {
      setTrackX(REST_X);
    }
  }
  lb.addEventListener('pointerup', endPointer);
  lb.addEventListener('pointercancel', e => {
    pointers.delete(e.pointerId);
    if (panning && e.pointerId === panPointerId) { panning = false; panPointerId = null; }
    if (dragging && e.pointerId === primaryPointerId) {
      dragging = false;
      snapTrackTo(REST_X);
    }
  });
  lb.addEventListener('click', e => {
    if (pinched) { pinched = false; return; }    // 핀치줌 직후 발생하는 클릭은 무시
    if (swiped) { swiped = false; return; }       // 스와이프 직후의 클릭은 무시
    if (e.target.closest('.lb-nav')) return;      // 이전/다음 버튼 조작은 닫기 방지
    if (scale > 1.01) { resetZoom(); return; }    // 확대된 상태에서 탭하면 닫지 않고 원래 크기로
    closeLightbox();
  });
  window.addEventListener('resize', () => { if (lb.classList.contains('show')) fitStage(); });
})();

/* ---------- 계좌 아코디언 ---------- */
function renderAccounts(sideKey, bodyId) {
  const body = document.getElementById(bodyId);
  body.innerHTML = CONFIG.ACCOUNTS[sideKey].map(a => `
    <div class="acc-row">
      <span class="who">${a.who}</span>
      <span class="num">${a.bank} ${a.num}<br /><small style="color:var(--ink2)">${a.name}</small></span>
      <button class="copy-btn" onclick="copyText('${a.bank} ${a.num}')">복사</button>
    </div>`).join('');
}
renderAccounts('groom', 'acc-groom-body');
renderAccounts('bride', 'acc-bride-body');

function toggleAcc(id) {
  document.getElementById(id).classList.toggle('open');
}

function copyText(text) {
  const ok = () => toast('계좌번호가 복사되었습니다');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(ok).catch(() => fallbackCopy(text, ok));
  } else fallbackCopy(text, ok);
}
function fallbackCopy(text, cb) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); cb(); } catch (e) { toast('복사에 실패했습니다'); }
  document.body.removeChild(ta);
}

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- 페이드인 ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.fade').forEach(el => io.observe(el));

/* ---------- RSVP 바텀시트 ---------- */
function openSheet() {
  document.getElementById('sheet-backdrop').classList.add('show');
  document.getElementById('sheet').classList.add('show');
}
function closeSheet() {
  document.getElementById('sheet-backdrop').classList.remove('show');
  document.getElementById('sheet').classList.remove('show');
}

/* 구글 스프레드시트(Apps Script 웹앱)로 전송.
   웹앱은 크로스오리진 응답에 CORS 헤더를 안 붙여주므로 mode:'no-cors'로 보내고,
   응답 내용을 읽을 수 없는 대신 요청이 던져지면 성공으로 간주(낙관적 처리)한다. */
async function submitRSVP() {
  const name = document.getElementById('rsvp-name').value.trim();
  const phone = document.getElementById('rsvp-phone').value.trim();
  const sideEl = document.querySelector('input[name="side"]:checked');
  const attendEl = document.querySelector('input[name="attend"]:checked');
  const msg = document.getElementById('rsvp-msg');
  msg.classList.remove('err');
  if (!sideEl)   { msg.textContent = '신랑측 / 신부측을 선택해 주세요.'; msg.classList.add('err'); return; }
  if (!name)     { msg.textContent = '성함을 입력해 주세요.'; msg.classList.add('err'); return; }
  if (!phone)    { msg.textContent = '전화번호를 입력해 주세요.'; msg.classList.add('err'); return; }
  if (!attendEl) { msg.textContent = '참석 / 불참을 선택해 주세요.'; msg.classList.add('err'); return; }

  const btn = document.getElementById('rsvp-submit');
  btn.disabled = true; msg.textContent = '전달 중…';
  try {
    const body = new FormData();
    body.append('side', sideEl.value);
    body.append('name', name);
    body.append('phone', phone);
    body.append('attend', attendEl.value);
    body.append('count', document.getElementById('rsvp-count').value || '1');
    await fetch(CONFIG.API_URL, { method: 'POST', mode: 'no-cors', body });
    msg.textContent = '소중한 의사가 전달되었습니다. 감사합니다!';
    setTimeout(closeSheet, 1500);
  } catch (e) {
    msg.textContent = '전달에 실패했습니다. 잠시 후 다시 시도해 주세요.';
    msg.classList.add('err');
    btn.disabled = false;
    return;
  }
  btn.disabled = false;
}
