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

// 1. 배경 높이 자동 조절 함수
function updateBoardHeight() {
  const board = document.getElementById("board");
  const postits = document.querySelectorAll(".postit");
  let maxBottom = window.innerHeight;
  postits.forEach(p => {
    const bottom = parseFloat(p.style.top) + parseFloat(p.style.height || 200);
    if (bottom > maxBottom) maxBottom = bottom;
  });
  board.style.height = (maxBottom + 500) + "px"; // 넉넉히 500px 여유
}

// 2. 겹침 감지 알고리즘 (충돌 체크)
function isOverlapping(newX, newY, newSize, existingPostits) {
  for (let p of existingPostits) {
    const ex = parseFloat(p.style.left);
    const ey = parseFloat(p.style.top);
    const es = parseFloat(p.style.width);
    
    // 사각형 영역끼리 겹치는지 비교 (간격 여유 15px 포함)
    const margin = 15;
    if (!(newX + newSize + margin < ex || 
          newX > ex + es + margin || 
          newY + newSize + margin < ey || 
          newY > ey + es + margin)) {
      return true; // 겹침!
    }
  }
  return false; // 안 겹침!
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
  trash.className = "trash"; trash.textContent = "🗑️";
  trash.onclick = async (e) => {
    e.stopPropagation();
    const pw = prompt("비밀번호");
    if (pw === data.password || pw === ADMIN_CODE) {
      await deleteDoc(doc(db, "notes", id));
      el.remove();
      updateBoardHeight();
    } else { alert("비밀번호 오류"); }
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
    if (!text || password.length !== 4) return alert("글과 4자리 비밀번호를 입력하세요!");

    const size = 180 + Math.max(0, text.length - 40) * 2;
    const existing = document.querySelectorAll(".postit");
    let x, y, attempts = 0;
    let found = false;

    // 빈 공간 찾기 루프 (최대 150번 시도)
    while (attempts < 150) {
      const currentH = document.getElementById("board").scrollHeight;
      x = Math.random() * (window.innerWidth - size - 40) + 20;
      y = Math.random() * (currentH - size - 40) + 20;
      
      if (!isOverlapping(x, y, size, existing)) {
        found = true;
        break;
      }
      attempts++;
    }

    // 자리가 없으면 그냥 맨 아래 빈 공간으로 배치
    if (!found) {
      y = document.getElementById("board").scrollHeight + 10;
    }

    await addDoc(collection(db, "notes"), {
      text, color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password, size, x, y, 
      rotate: Math.random() * 20 - 10, 
      createdAt: Date.now()
    });

    modal.style.display = "none";
    document.getElementById("textInput").value = "";
    document.getElementById("passwordInput").value = "";
    load();
  };
  load();
});
