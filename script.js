// ... Firebase 설정 부분은 그대로 유지 ...

const SIZE = 160;
const MARGIN = 15;

// 면적 겹침 체크 (실제 보드 위의 x, y 좌표 대조)
function checkOverlap(x, y) {
  const postits = document.querySelectorAll('.postit');
  for (let p of postits) {
    const px = parseFloat(p.style.left);
    const py = parseFloat(p.style.top);
    // 노란 네모 면적이 1픽셀이라도 겹치는지 확인
    if (!(x + SIZE + MARGIN < px || x > px + SIZE + MARGIN || 
          y + SIZE + MARGIN < py || y > py + SIZE + MARGIN)) {
      return true;
    }
  }
  return false;
}

// 빈 공간 찾기
function getSafePosition() {
  const winW = window.innerWidth;
  // 현재 보드의 전체 높이를 기준으로 빈 공간 수색
  const boardH = document.getElementById("board").scrollHeight || window.innerHeight;
  
  for (let y = 20; y < boardH + 2000; y += 30) {
    for (let x = 20; x < winW - SIZE - 20; x += 30) {
      if (!checkOverlap(x, y)) return { x, y };
    }
  }
  return { x: 20, y: 20 };
}

function render(data, id) {
  if (document.getElementById(id)) return;
  const board = document.getElementById("board");
  const el = document.createElement("div");
  el.className = "postit";
  el.id = id;
  
  // 보드 위의 절대 좌표에 박제
  el.style.left = `${data.x}px`;
  el.style.top = `${data.y}px`;
  el.style.backgroundColor = data.color;
  el.style.fontFamily = data.font;
  el.style.transform = `rotate(${data.rotate || 0}deg)`;
  el.innerText = data.text;
  
  // 삭제 버튼 로직 등 동일...
  board.appendChild(el);
}

// 저장 시 로직
document.getElementById("savePostit").onclick = async () => {
    // ... 입력값 체크 ...
    const pos = getSafePosition(); // 보드 전체 면적에서 빈틈 수색

    const docRef = await addDoc(collection(db, "notes"), {
      text, color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password, x: pos.x, y: pos.y, 
      rotate: Math.random() * 8 - 4, createdAt: Date.now()
    });
    // ... 렌더링 및 모달 닫기 ...
};
