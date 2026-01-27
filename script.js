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
const FIXED_SIZE = 160; // 초기 알려드렸던 표준 크기 200px

function updateBoardDimensions() {
  const postits = document.querySelectorAll(".postit");
  let maxBottom = window.innerHeight;
  let maxRight = window.innerWidth;
  postits.forEach(p => {
    const bottom = parseFloat(p.style.top) + FIXED_SIZE;
    const right = parseFloat(p.style.left) + FIXED_SIZE;
    if (bottom > maxBottom) maxBottom = bottom;
    if (right > maxRight) maxRight = right;
  });
  const board = document.getElementById("board");
  board.style.height = (maxBottom + 100) + "px";
  board.style.width = (maxRight > window.innerWidth ? maxRight + 50 : window.innerWidth) + "px";
}

function isOverlapping(x, y, existingPostits) {
  const margin = 10;
  for (let p of existingPostits) {
    const ex = parseFloat(p.style.left);
    const ey = parseFloat(p.style.top);
    if (!(x + FIXED_SIZE < ex - margin || x > ex + FIXED_SIZE + margin || y + FIXED_SIZE < ey - margin || y > ey + FIXED_SIZE + margin)) {
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
    width: ${FIXED_SIZE}px;
    height: ${FIXED_SIZE}px;
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
      updateBoardDimensions();
    }
  };
  el.appendChild(trash);
  board.appendChild(el);
}

async function load() {
  document.getElementById("board").innerHTML = "";
  const snap = await getDocs(collection(db, "notes"));
  snap.forEach(d => createPostit(d.data(), d.id));
  updateBoardDimensions();
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

    const existing = Array.from(document.querySelectorAll(".postit"));
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    
    let finalX, finalY, found = false;

    // 현재 화면 안에서 먼저 빈틈 탐색 (1000번 시도)
    for (let attempts = 0; attempts < 1000; attempts++) {
      let x = Math.random() * (winW - FIXED_SIZE - 40) + 20;
      let y = Math.random() * (winH - FIXED_SIZE - 100) + 20;
      if (!isOverlapping(x, y, existing)) {
        finalX = x; finalY = y; found = true; break;
      }
    }

    // 화면이 꽉 찼으면 전체 보드 영역으로 확장 탐색
    if (!found) {
      const currentFullH = document.getElementById("board").scrollHeight;
      for (let attempts = 0; attempts < 500; attempts++) {
        let x = Math.random() * (winW - FIXED_SIZE - 40) + 20;
        let y = Math.random() * (currentFullH + 200);
        if (!isOverlapping(x, y, existing)) {
          finalX = x; finalY = y; found = true; break;
        }
      }
    }

    // 최후의 수단: 화면 내 랜덤 강제 배치 (아래로 도망가지 않도록)
    if (!found) {
      finalX = Math.random() * (winW - FIXED_SIZE - 40) + 20;
      finalY = Math.random() * (winH - FIXED_SIZE - 100) + 20;
    }

    await addDoc(collection(db, "notes"), {
      text, color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password, x: finalX, y: finalY, 
      rotate: Math.random() * 10 - 5, createdAt: Date.now()
    });

    modal.style.display = "none";
    document.getElementById("textInput").value = "";
    load();
  };
  load();
});

