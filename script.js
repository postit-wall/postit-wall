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

// 보드 높이를 포스트잇 위치에 맞춰 확장하는 함수
function expandBoard() {
  const board = document.getElementById("board");
  const postits = document.querySelectorAll(".postit");
  let maxBottom = window.innerHeight;

  postits.forEach(el => {
    const bottom = parseFloat(el.style.top) + parseFloat(el.style.height);
    if (bottom > maxBottom) maxBottom = bottom;
  });

  // 가장 아래 포스트잇보다 200px 더 여유 있게 배경 확장
  board.style.height = (maxBottom + 200) + "px";
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
    if (prompt("비밀번호") === data.password) {
      await deleteDoc(doc(db, "notes", id));
      el.remove();
      expandBoard();
    }
  };

  el.appendChild(trash);
  board.appendChild(el);
}

async function load() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  const snap = await getDocs(collection(db, "notes"));
  snap.forEach(d => createPostit(d.data(), d.id));
  
  // 데이터 로딩 직후 높이 계산
  expandBoard();
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const addBtn = document.getElementById("addPostitBtn");
  const saveBtn = document.getElementById("savePostit");

  addBtn.onclick = () => { modal.style.display = "block"; };
  
  saveBtn.onclick = async () => {
    const text = document.getElementById("textInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    if (!text || password.length !== 4) return alert("체크!");

    const size = 160 + Math.max(0, text.length - 40) * 2;
    const winW = window.innerWidth;
    
    // 현재 보드 높이 확인
    const currentH = document.getElementById("board").offsetHeight;

    await addDoc(collection(db, "notes"), {
      text,
      color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password,
      size,
      x: Math.random() * (winW - size - 40) + 20,
      y: Math.random() * (currentH - size - 40) + 20,
      rotate: Math.random() * 20 - 10,
      createdAt: Date.now()
    });

    modal.style.display = "none";
    load();
  };

  load();
});
