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
const SIZE = 160;
const MARGIN = 15; // 포스트잇 사이의 여유 공간

// 겹침 여부 확인 함수
function isOverlapping(x, y, existing) {
  for (let p of existing) {
    const ex = parseFloat(p.style.left);
    const ey = parseFloat(p.style.top);
    // 충돌 박스 계산 (마진 포함)
    if (!(x + SIZE + MARGIN < ex || x > ex + SIZE + MARGIN || 
          y + SIZE + MARGIN < ey || y > ey + SIZE + MARGIN)) {
      return true;
    }
  }
  return false;
}

// 빈자리 찾기 로직 (그리드 스캔)
function findEmptySpace(existing) {
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const step = 20; // 20픽셀 단위로 정밀하게 스캔

  // 1단계: 현재 눈에 보이는 화면(Viewport) 안에서 위에서부터 아래로 수색
  for (let y = 20; y < winH - SIZE; y += step) {
    for (let x = 20; x < winW - SIZE; x += step) {
      if (!isOverlapping(x, y, existing)) {
        return { x, y };
      }
    }
  }

  // 2단계: 화면 안에 자리가 없으면 스크롤 아래 영역까지 확장해서 수색
  const maxSearchH = Math.max(document.getElementById("board").scrollHeight, winH + 1000);
  for (let y = winH; y < maxSearchH; y += step) {
    for (let x = 20; x < winW - SIZE; x += step) {
      if (!isOverlapping(x, y, existing)) {
        return { x, y };
      }
    }
  }

  // 3단계: 정말 자리가 하나도 없으면 (이론상 거의 불가능) 아주 조금씩 겹치게 배치
  return { x: Math.random() * (winW - SIZE), y: Math.random() * (winH - SIZE) };
}

function createPostit(data, id) {
  const board = document.getElementById("board");
  const el = document.createElement("div");
  el.className = "postit";
  el.style.cssText = `background:${data.color}; font-family:${data.font}; width:${SIZE}px; height:${SIZE}px; left:${data.x}px; top:${data.y}px; transform:rotate(${data.rotate}deg);`;
  el.innerText = data.text;
  
  const trash = document.createElement("span");
  trash.className = "trash"; trash.textContent = "🗑️";
  trash.onclick = async (e) => {
    e.stopPropagation();
    if (prompt("비밀번호") === data.password || ADMIN_CODE) {
      await deleteDoc(doc(db, "notes", id));
      el.remove();
    }
  };
  el.appendChild(trash);
  board.appendChild(el);
}

async function load() {
  document.getElementById("board").innerHTML = "";
  const snap = await getDocs(collection(db, "notes"));
  snap.forEach(d => createPostit(d.data(), d.id));
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const saveBtn = document.getElementById("savePostit");

  document.getElementById("addPostitBtn").onclick = () => { modal.style.display = "block"; };
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

  saveBtn.onclick = async () => {
    const text = document.getElementById("textInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    if (!text || password.length !== 4) return alert("4자리 비밀번호를 입력하세요!");

    const existing = Array.from(document.querySelectorAll(".postit"));
    const pos = findEmptySpace(existing); // 똑똑하게 빈자리 계산

    await addDoc(collection(db, "notes"), {
      text, color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password, x: pos.x, y: pos.y, 
      rotate: Math.random() * 10 - 5, createdAt: Date.now()
    });

    modal.style.display = "none";
    document.getElementById("textInput").value = "";
    load();
  };
  load();
});
