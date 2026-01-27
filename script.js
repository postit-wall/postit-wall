import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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
const SIZE = 160;
const MARGIN = 10;

// 실제 물리적인 면적이 겹치는지 체크하는 함수
function checkOverlap(x, y) {
  const postits = document.querySelectorAll('.postit');
  for (let p of postits) {
    const px = parseFloat(p.style.left);
    const py = parseFloat(p.style.top);
    // AABB 충돌 판정: 네모 면적 전체를 비교
    if (!(x + SIZE + MARGIN < px || x > px + SIZE + MARGIN || 
          y + SIZE + MARGIN < py || y > py + SIZE + MARGIN)) {
      return true; // 겹침
    }
  }
  return false;
}

// 비어있는 첫 번째 구멍 찾기
function getSafePosition() {
  const winW = window.innerWidth;
  const boardH = document.getElementById("board").scrollHeight || window.innerHeight;
  
  // y축 20px부터 시작해 아래로 촘촘히 수색
  for (let y = 20; y < boardH + 1000; y += 25) {
    for (let x = 20; x < winW - SIZE - 20; x += 25) {
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
  // 저장된 절대 좌표 그대로 배치 (스크롤 영향 받지 않음)
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
    if (prompt("비밀번호") === data.password || prompt("관리자?") === "87524") {
      await deleteDoc(doc(db, "notes", id));
      el.remove();
    }
  };
  el.appendChild(trash);
  board.appendChild(el);
}

async function load() {
  const q = query(collection(db, "notes"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  snap.forEach(d => render(d.data(), d.id));
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  document.getElementById("addPostitBtn").onclick = () => { modal.style.display = "block"; };
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

  document.getElementById("savePostit").onclick = async () => {
    const text = document.getElementById("textInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    if (!text || password.length !== 4) return alert("비밀번호 4자리를 입력하세요!");

    const pos = getSafePosition(); // 저장 버튼을 누르는 시점에 완벽한 빈자리 계산

    const docRef = await addDoc(collection(db, "notes"), {
      text, color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password, x: pos.x, y: pos.y, 
      rotate: Math.random() * 8 - 4, createdAt: Date.now()
    });

    render({text, color: document.getElementById("colorInput").value, font: document.getElementById("fontInput").value, password, x: pos.x, y: pos.y}, docRef.id);
    modal.style.display = "none";
    document.getElementById("textInput").value = "";
  };
  load();
});
