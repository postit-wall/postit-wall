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

// 보드 높이를 포스트잇 위치에 맞춰 강제로 늘려주는 함수
function updateBoardHeight() {
  const board = document.getElementById("board");
  const postits = document.querySelectorAll(".postit");
  let maxBottom = window.innerHeight;

  postits.forEach(p => {
    const bottom = parseFloat(p.style.top) + parseFloat(p.style.height || 200);
    if (bottom > maxBottom) maxBottom = bottom;
  });

  board.style.height = (maxBottom + 300) + "px"; // 여유 공간 300px
}

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
      updateBoardHeight();
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
  updateBoardHeight(); // 데이터 로딩 후 높이 조절
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const addBtn = document.getElementById("addPostitBtn");
  const saveBtn = document.getElementById("savePostit");

  addBtn.onclick = () => { modal.style.display = "block"; };
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

  saveBtn.onclick = async () => {
    const text = document.getElementById("textInput").value.trim();
    const color = document.getElementById("colorInput").value;
    const font = document.getElementById("fontInput").value;
    const password = document.getElementById("passwordInput").value;

    if (!text || password.length !== 4) {
      alert("글귀와 4자리 비밀번호를 입력하세요.");
      return;
    }

    const size = 160 + Math.max(0, text.length - 40) * 2;
    const winW = window.innerWidth;
    const currentBoardHeight = document.getElementById("board").scrollHeight;

    await addDoc(collection(db, "notes"), {
      text, color, font, password, size,
      x: Math.random() * (winW - size - 40) + 20,
      y: Math.random() * (currentBoardHeight - size - 40) + 20,
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
