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

const rand = (min, max) => Math.random() * (max - min) + min;

function createPostit(data, id) {
  const board = document.getElementById("board");
  const el = document.createElement("div");
  el.className = "postit";
  el.style.background = data.color;
  el.style.fontFamily = data.font;
  el.style.width = data.size + "px";
  el.style.height = data.size + "px";
  el.style.left = data.x + "px";
  el.style.top = data.y + "px";
  el.style.transform = `rotate(${data.rotate}deg)`;
  el.innerText = data.text;

  const trash = document.createElement("span");
  trash.className = "trash";
  trash.textContent = "🗑️";
  trash.onclick = async (e) => {
    e.stopPropagation();
    const pw = prompt("비밀번호 입력");
    if (pw === data.password || pw === ADMIN_CODE) {
      await deleteDoc(doc(db, "notes", id));
      el.remove();
    } else { alert("비밀번호가 틀렸어요"); }
  };
  el.appendChild(trash);
  board.appendChild(el);
}

async function load() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  const snap = await getDocs(collection(db, "notes"));
  snap.forEach(d => createPostit(d.data(), d.id));
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const addBtn = document.getElementById("addPostitBtn");
  const saveBtn = document.getElementById("savePostit");

  addBtn.onclick = () => { modal.style.display = "block"; };
  modal.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

  saveBtn.onclick = async () => {
    const text = document.getElementById("textInput").value.trim();
    const color = document.getElementById("colorInput").value;
    const font = document.getElementById("fontInput").value;
    const password = document.getElementById("passwordInput").value;

    if (!text || password.length !== 4) {
      alert("글과 4자리 비밀번호 필요");
      return;
    }

    const size = 160 + Math.max(0, text.length - 40) * 2;
    const allPostits = document.querySelectorAll(".postit");
    
    let currentMaxY = window.innerHeight; // 기본 화면 높이

    // 현재 붙어있는 포스트잇들 중 가장 아래쪽 좌표 찾기
    allPostits.forEach(p => {
      const bottom = parseFloat(p.style.top) + size;
      if (bottom > currentMaxY) currentMaxY = bottom;
    });

    // 화면 하단에 여유가 200px 미만이면 아래로 영역 확장
    const spawnYLimit = currentMaxY;

    await addDoc(collection(db, "notes"), {
      text, color, font, password, size,
      x: rand(20, window.innerWidth - size - 20),
      y: rand(20, spawnYLimit - size - 20), // 위에서 찾은 한계점 내에서 랜덤 배치
      rotate: rand(-10, 10),
      createdAt: Date.now()
    });

    modal.style.display = "none";
    document.getElementById("textInput").value = "";
    document.getElementById("passwordInput").value = "";
    load();
  };

  load();
});
