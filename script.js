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
const SIZE = 160; // 요청하신 160px 고정

function updateBoardDimensions() {
  const postits = document.querySelectorAll(".postit");
  let maxBottom = window.innerHeight;
  let maxRight = window.innerWidth;
  postits.forEach(p => {
    const bottom = parseFloat(p.style.top) + SIZE;
    const right = parseFloat(p.style.left) + SIZE;
    if (bottom > maxBottom) maxBottom = bottom;
    if (right > maxRight) maxRight = right;
  });
  const board = document.getElementById("board");
  board.style.height = (maxBottom + 100) + "px";
  board.style.width = (maxRight > window.innerWidth ? maxRight + 20 : window.innerWidth) + "px";
}

// 훨씬 강력해진 겹침 판정 (기존 요소 전수 조사)
function checkOverlap(newX, newY) {
  const margin = 15; // 포스트잇 사이의 최소 벌어짐
  const elements = document.querySelectorAll(".postit");
  
  for (let el of elements) {
    const ex = parseFloat(el.style.left);
    const ey = parseFloat(el.style.top);
    
    // 두 사각형이 겹치는지 확인하는 표준 공식
    if (!(newX + SIZE + margin < ex || 
          newX > ex + SIZE + margin || 
          newY + SIZE + margin < ey || 
          newY > ey + SIZE + margin)) {
      return true; // 겹침 발생
    }
  }
  return false;
}

function createPostit(data, id) {
  const board = document.getElementById("board");
  const el = document.createElement("div");
  el.className = "postit";
  el.style.cssText = `
    background: ${data.color}; font-family: ${data.font};
    width: ${SIZE}px; height: ${SIZE}px;
    left: ${data.x}px; top: ${data.y}px;
    transform: rotate(${data.rotate}deg);
  `;
  el.innerText = data.text;
  
  const trash = document.createElement("span");
  trash.className = "trash"; trash.textContent = "🗑️";
  trash.onclick = async (e) => {
    e.stopPropagation();
    if (prompt("비밀번호") === data.password || ADMIN_CODE) {
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

    const winW = window.innerWidth;
    const winH = window.innerHeight;
    let finalX, finalY, found = false;

    // 현재 화면 안에서 2000번 시도하여 빈자리 수색
    for (let attempts = 0; attempts < 2000; attempts++) {
      let tx = Math.random() * (winW - SIZE - 40) + 20;
      let ty = Math.random() * (winH - SIZE - 100) + 20;

      if (!checkOverlap(tx, ty)) {
        finalX = tx; finalY = ty; found = true; break;
      }
    }

    // 화면 내에 자리가 없을 경우에만 아래로 확장
    if (!found) {
      const fullH = document.getElementById("board").scrollHeight;
      for (let attempts = 0; attempts < 1000; attempts++) {
        let tx = Math.random() * (winW - SIZE - 40) + 20;
        let ty = Math.random() * (fullH + 200);
        if (!checkOverlap(tx, ty)) {
          finalX = tx; finalY = ty; found = true; break;
        }
      }
    }

    // [최종 방어] 화면 안에 겹쳐서라도 둠 (아래로 내려가는 것 방지)
    if (!found) {
      finalX = Math.random() * (winW - SIZE - 40) + 20;
      finalY = Math.random() * (winH - SIZE - 100) + 20;
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
