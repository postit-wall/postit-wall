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
const MARGIN = 10; // 포스트잇 간 최소 간격

// 현재 화면에 있는 모든 포스트잇의 실제 좌표 정보 가져오기
function getExistingRects() {
  return Array.from(document.querySelectorAll('.postit')).map(el => {
    return {
      left: parseFloat(el.style.left),
      top: parseFloat(el.style.top),
      right: parseFloat(el.style.left) + SIZE,
      bottom: parseFloat(el.style.top) + SIZE
    };
  });
}

// 특정 좌표가 기존 것들과 겹치는지 체크
function isOverlapping(x, y, existingRects) {
  for (let rect of existingRects) {
    if (!(x + SIZE + MARGIN < rect.left || 
          x > rect.right + MARGIN || 
          y + SIZE + MARGIN < rect.top || 
          y > rect.bottom + MARGIN)) {
      return true; // 겹침
    }
  }
  return false;
}

// 빈 공간을 찾을 때까지 화면 전체를 훑는 알고리즘
function findSmartPosition() {
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const existingRects = getExistingRects();
  
  // 1. 화면 위에서부터 촘촘하게(30px 단위) 검색
  for (let y = 20; y < winH + 1000; y += 30) {
    for (let x = 20; x < winW - SIZE - 20; x += 30) {
      if (!isOverlapping(x, y, existingRects)) {
        return { x, y };
      }
    }
  }
  // 자리가 전혀 없으면 맨 아래쪽 새로운 공간 생성
  return { x: 20, y: document.getElementById("board").scrollHeight + 20 };
}

function createPostit(data, id) {
  const board = document.getElementById("board");
  const el = document.createElement("div");
  el.className = "postit";
  el.style.left = `${data.x}px`;
  el.style.top = `${data.y}px`;
  el.style.backgroundColor = data.color;
  el.style.fontFamily = data.font;
  el.style.transform = `rotate(${data.rotate || 0}deg)`;
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

    // 위치를 먼저 계산한 뒤 저장
    const pos = findSmartPosition();

    await addDoc(collection(db, "notes"), {
      text, color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password, x: pos.x, y: pos.y, 
      rotate: Math.random() * 8 - 4, createdAt: Date.now()
    });

    modal.style.display = "none";
    document.getElementById("textInput").value = "";
    load();
  };
  load();
});
