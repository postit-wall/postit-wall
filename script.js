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
    if (!text || password.length !== 4) return alert("비밀번호 4자리를 입력하세요!");

    // 저장 전, 현재 DOM 상태를 기준으로 빈틈을 다시 계산
    const pos = findSafePosition();

    await addDoc(collection(db, "notes"), {
      text, color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password, x: pos.x, y: pos.y, 
      rotate: Math.random() * 6 - 3, createdAt: Date.now()
    });

    modal.style.display = "none";
    document.getElementById("textInput").value = "";
    load();
  };
  load();
});
