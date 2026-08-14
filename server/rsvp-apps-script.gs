/**
 * 참석 의사 전달 → 구글 스프레드시트 자동 기록용 Apps Script.
 *
 * 설치 방법
 * 1. 응답을 모을 구글 스프레드시트를 새로 만든다 (또는 기존 시트 사용).
 * 2. 시트 메뉴 「확장 프로그램」 → 「Apps Script」를 연다.
 * 3. 기본 생성된 코드를 전부 지우고 이 파일 내용을 붙여넣는다.
 * 4. 「배포」 → 「새 배포」 → 유형: 웹 앱
 *      - 실행할 사용자: 나
 *      - 액세스 권한: 모든 사용자 (익명 제출을 받으려면 필수)
 * 5. 배포 후 나오는 웹 앱 URL(…/exec)을 복사해서
 *    index.html 의 CONFIG.API_URL 에 붙여넣는다.
 * 6. 코드나 배포 설정을 바꿀 때마다 「배포 관리」 → 배포 수정 → 새 버전으로 다시 배포해야
 *    변경사항이 실제 URL에 반영된다 (수정만 하고 재배포를 안 하면 예전 코드가 계속 실행됨).
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var p = e.parameter;

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['제출 시각', '신랑측/신부측', '성함', '전화번호', '참석여부', '인원수']);
    }

    sheet.appendRow([
      new Date(),
      p.side === 'groom' ? '신랑측' : (p.side === 'bride' ? '신부측' : p.side),
      p.name || '',
      p.phone || '',
      p.attend === 'yes' ? '참석' : (p.attend === 'no' ? '불참' : p.attend),
      p.count || '1',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
