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
const P_SIZE = 160; // 포스트잇 크기
const P_MARGIN = 20; // 겹침 방지를 위한 최소 여유 픽셀

// 면적 겹침을 1픽셀 단위로 검사하는 핵심 함수
function isSpaceOccupied(x, y, existingRects) {
  for (let rect of existingRects) {
    // AABB 충돌 알고리즘: 하나라도 성립 안 하면 겹친 것임
    const overlap = !(
      x + P_SIZE + P_MARGIN < rect.x || // 내 오른쪽이 상대 왼쪽보다 작거나
      x > rect.x + P_SIZE + P_MARGIN || // 내 왼쪽이 상대 오른쪽보다 크거나
      y + P_SIZE + P_MARGIN < rect.y || // 내 아래쪽이 상대 위쪽보다 작거나
      y > rect.y + P_SIZE + P_MARGIN    // 내 위쪽이 상대 아래쪽보다 크면 안 겹침
    );
    if (overlap) return true;
  }
  return false;
}

// 빈틈을 찾을 때까지 화면 전체를 격자 스캔
function findSafePosition() {
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  
  // 현재 화면에 있는 모든 포스트잇의 좌표 정보를 수집
  const existingRects = Array.from(document.querySelectorAll('.postit')).map(el => ({
    x: parseFloat(el.style.left),
    y: parseFloat(el.style.top)
  }));

  // 화면 왼쪽 위(20, 20)부터 아래쪽으로 훑으며 빈자리 수색
  // y축 범위를 넉넉하게 주어 화면 아래로도 빈틈이 있으면 채우도록 함
  for (let y = 20; y < 5000; y += 20) {
    for (let x = 20; x < winW - P_SIZE - 20; x += 20) {
      if (!isSpaceOccupied(x, y, existingRects)) {
        return { x, y };
      }
    }
  }
  return { x: 20, y: 20 }; // 정말 자리가 없으면 (이론상 불가능)
}

function createPostit(data, id) {
  const board = document.getElementById("board");
  const el = document.createElement("div");
  el.className = "postit";
  el.style.cssText = `
    left: ${data.x}px;
    top: ${data.y}px;
    background-color: ${data.color};
    font-family: ${data.font};
    transform: rotate(${data.rotate || 0}deg);
  `;
  el.innerText = data.text;
  
  const trash = document.createElement("span");
  trash.className = "trash"; trash.textContent = import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
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
const ADMIN_CODE = "87524";
const SIZE = 160;
const MARGIN = 15;

// 면적 충돌 감지 (단 1픽셀이라도 겹치면 true)
function checkCollision(x, y, existingRects) {
  for (let rect of existingRects) {
    if (!(x + SIZE + MARGIN < rect.x || x > rect.x + SIZE + MARGIN ||
          y + SIZE + MARGIN < rect.y || y > rect.y + SIZE + MARGIN)) {
      return true;
    }
  }
  return false;
}

// 겹치지 않는 빈자리 찾기
function getNewPosition() {
  const existingRects = Array.from(document.querySelectorAll('.postit')).map(el => ({
    x: parseFloat(el.style.left),
    y: parseFloat(el.style.top)
  }));

  const winW = window.innerWidth;
  const boardH = document.getElementById("board").scrollHeight;

  // 위에서 아래로 20px씩 스캔하며 빈자리 찾기
  for (let y = 20; y < boardH + 1000; y += 20) {
    for (let x = 20; x < winW - SIZE - 20; x += 20) {
      if (!checkCollision(x, y, existingRects)) {
        return { x, y };
      }
    }
  }
  return { x: 20, y: boardH + 20 };
}

function renderPostit(data, id) {
  // 이미 화면에 있는 아이디라면 중복 생성 방지
  if (document.getElementById(id)) return;

  const board = document.getElementById("board");
  const el = document.createElement("div");
  el.className = "postit";
  el.id = id; // 아이디 부여로 중복 방지 및 위치 고정
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
  // 전체 삭제 후 재생성이 아니라, 새로 추가된 것만 가져오거나 고정된 상태 유지
  const q = query(collection(db, "notes"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  snap.forEach(d => renderPostit(d.data(), d.id));
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const saveBtn = document.getElementById("savePostit");

  document.getElementById("addPostitBtn").onclick = () => { modal.style.display = "block"; };
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

  saveBtn.onclick = async () => {
    const text = document.getElementById("textInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    if (!text || password.length !== 4) return alert("4자리 비밀번호!");

    const pos = getNewPosition(); // 저장 전 빈 구멍 수색

    const docRef = await addDoc(collection(db, "notes"), {
      text, color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password, x: pos.x, y: pos.y, 
      rotate: Math.random() * 8 - 4, createdAt: Date.now()
    });

    renderPostit({
      text, color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password, x: pos.x, y: pos.y, rotate: 0
    }, docRef.id);

    modal.style.display = "none";
    document.getElementById("textInput").value = "";
  };
  load();
});
