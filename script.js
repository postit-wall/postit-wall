import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtEtTKT_ay0KZoNw6kxiWt_RkI6L2UvKQ",
  authDomain: "postit-wall-7ba23.firebaseapp.com",
  projectId: "postit-wall-7ba23",
  storageBucket: "postit-wall-7ba23.appspot.com",
  messagingSenderId: "447459662497",
  appId: "1:447459662497:web:73ebd7b62d08ca6f12aee0",
  measurementId: "G-22QZE2KBN3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const ADMIN_CODE = "87524";

// 보드 전체 높이 갱신
function updateBoardHeight() {
  const board = document.getElementById("board");
  const postits = document.querySelectorAll(".postit");
  let maxBottom = window.innerHeight;
  postits.forEach(p => {
    const bottom = parseFloat(p.style.top) + parseFloat(p.style.height || 200);
    if (bottom > maxBottom) maxBottom = bottom;
  });
  board.style.height = (maxBottom + 300) + "px";
}

// 다른 포스트잇과 겹치는지 체크
function isOverlapping(x, y, size, existingPostits) {
  const margin = 15; // 포스트잇 간 최소 간격
  for (let p of existingPostits) {
    const ex = parseFloat(p.style.left);
    const ey = parseFloat(p.style.top);
    const es = parseFloat(p.style.width);
    // 겹침 판정 로직
    if (!(x + size < ex - margin || x > ex + es + margin || y + size < ey - margin || y > ey + es + margin)) {
      return true;
    }
  }
  return false;
}

function createPostit(data, id) {
  const board = document.getElementById("board");
  const el = document.createElement("div");
  el.className = "postit";
  el.style.cssText = `
    background: ${data.color};
    font-family: ${data.font};
    width: ${data.size}px;
    height: ${data.size}px;
    left: ${data.x}px;
    top: ${data.y}px;
    transform: rotate(${data.rotate}deg);
  `;
  el.innerText = data.text;
  
  const trash = document.createElement("span");
  trash.className = "trash";
  trash.textContent = "🗑️";
  trash.onclick = async (e) => {
    e.stopPropagation();
    const pw = prompt("비밀번호를 입력하세요.");
    if (pw === data.password || pw === ADMIN_CODE) {
      await deleteDoc(doc(db, "notes", id));
      el.remove();
      updateBoardHeight();
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  };
  el.appendChild(trash);
  board.appendChild(el);
}

async function load() {
  document.getElementById("board").innerHTML = "";
  const snap = await getDocs(collection(db, "notes"));
  snap.forEach(d => createPostit(d.data(), d.id));
  updateBoardHeight();
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const saveBtn = document.getElementById("savePostit");

  document.getElementById("addPostitBtn").onclick = () => { modal.style.display = "block"; };
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

  saveBtn.onclick = async () => {
    const text = document.getElementById("textInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    if (!text || password.length !== 4) return alert("글귀와 4자리 비밀번호를 입력하세요!");

    const size = 200 + Math.max(0, text.length - 30) * 2.5;
    const existing = Array.from(document.querySelectorAll(".postit"));
    const winW = window.innerWidth;
    
    let finalX, finalY, found = false;

    // [스캔 로직] 상단(y=20)부터 하단으로 30px씩 내려가며 빈틈을 찾음
    // 랜덤으로 대충 던지는 게 아니라 위에서부터 빈 구멍을 수색함
    for (let y = 20; y < document.getElementById("board").scrollHeight + 500; y += 30) {
      for (let i = 0; i < 20; i++) { // 각 높이에서 20번 랜덤 x좌표 시도
        let x = Math.random() * (winW - size - 40) + 20;
        if (!isOverlapping(x, y, size, existing)) {
          finalX = x;
          finalY = y;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    await addDoc(collection(db, "notes"), {
      text,
      color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password,
      size,
      x: finalX,
      y: finalY,
      rotate: Math.random() * 12 - 6,
      createdAt: Date.now()
    });

    modal.style.display = "none";
    document.getElementById("textInput").value = "";
    document.getElementById("passwordInput").value = "";
    load();
  };

  load();
});
