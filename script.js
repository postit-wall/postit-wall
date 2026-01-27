@import url("https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap");

html, body {
  margin: 0; padding: 0;
  width: 100%; min-height: 100%;
  background-color: #c69c6d;
}

#board {
  position: relative; /* 모든 포스트잇 좌표의 기준점이 됩니다 */
  width: 100%;
  min-height: 100vh;
  background-image: url("images/cork.jpg");
  background-repeat: repeat;
  background-attachment: fixed; /* 배경은 화면에 고정, 포스트잇만 스크롤됨 */
  background-size: auto;
  overflow-x: hidden;
}

.postit {
  position: absolute; /* #board의 (0,0)을 기준으로 배치됩니다 */
  width: 160px !important;
  height: 160px !important;
  padding: 15px;
  box-shadow: 3px 6px 10px rgba(0,0,0,0.4);
  text-align: left;
  line-height: 1.4;
  font-size: 16px;
  word-wrap: break-word;
  overflow: hidden;
  box-sizing: border-box;
  /* 스크롤 시 움직임을 방지하기 위해 transition이나 변형을 최소화 */
  will-change: transform; 
}

/* 추가 버튼 & 모달 (생략 방지용 핵심 코드) */
#addPostitBtn { position: fixed; right: 20px; bottom: 20px; z-index: 100; padding: 12px 24px; border: none; border-radius: 50px; background: #333; color: white; font-size: 16px; font-weight: bold; cursor: pointer; }
#modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; }
.modal-box { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 25px; border-radius: 20px; width: 90%; max-width: 500px; }
.modal-box textarea { width: 100%; height: 200px; margin-bottom: 15px; padding: 12px; font-size: 18px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 10px; resize: none; }
#savePostit { width: 100%; padding: 15px; background: #333; color: white; border: none; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer; }
.trash { position: absolute; top: 5px; right: 8px; cursor: pointer; display: none; }
.postit:hover .trash { display: block; }
