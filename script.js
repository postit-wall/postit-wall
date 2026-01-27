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

function updateBoardHeight() {
  const board = document.getElementById("board");
  const postits = document.querySelectorAll(".postit");
  let maxBottom = window.innerHeight;
  postits.forEach(p => {
    const bottom = parseFloat(p.style.top) + parseFloat(p.style.height || 200);
    if (bottom > maxBottom) maxBottom = bottom;
  });
  board.style.height = (maxBottom + 500) + "px";
}

function isOverlapping(newX, newY, newSize, existingPostits) {
  for (let p of existingPostits) {
    const ex = parseFloat(p.style.left);
    const ey = parseFloat(p.style.top);
    const es = parseFloat(p.style.width);
    const margin = 15;
    if (!(newX + newSize + margin < ex || newX > ex + es + margin || newY + newSize + margin < ey || newY > ey + es + margin)) {
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

    // 글씨가 커졌으므로 포스트잇 기본 사이즈도 약간 키움
    const size = 200 + Math.max(0, text.length - 30) * 3;
    const existing = document.querySelectorAll(".postit");
    let x, y, attempts = 0, found = false;

    while (attempts < 200) {
      const currentH = document.getElementById("board").scrollHeight;
      x = Math.random() * (window.innerWidth - size - 40) + 20;
      y = Math.random() * (currentH - size - 40) + 20;
      if (!isOverlapping(x, y, size, existing)) { found = true; break; }
      attempts++;
    }
    if (!found) y = document.getElementById("board").scrollHeight + 20;

    await addDoc(collection(db, "notes"), {
      text, color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password, size, x, y, 
      rotate: Math.random() * 16 - 8, 
      createdAt: Date.now()
    });

    modal.style.display = "none";
    document.getElementById("textInput").value = "";
    document.getElementById("passwordInput").value = "";
    load();
  };
  load();
});
