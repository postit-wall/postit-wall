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
  board.style.height = (maxBottom + 300) + "px";
}

// 중요: '현재 화면에 보이는 포스트잇' 하고만 겹치는지 체크
function isOverlappingInView(x, y, size, existingPostits, viewLimit) {
  const margin = 5;
  for (let p of existingPostits) {
    const ex = parseFloat(p.style.left);
    const ey = parseFloat(p.style.top);
    const es = parseFloat(p.style.width);
    
    // 화면 밖(viewLimit 아래)에 있는 포스트잇은 계산에서 아예 제외!
    if (ey > viewLimit) continue;

    if (!(x + size < ex - margin || x > ex + es + margin || y + size < ey - margin || y > ey + es + margin)) {
      return true;
    }
  }
  return false;
}

function createPostit(data, id) {
  const board = document.getElementById("board");
  const el = document.createElement("div");
  el.className = "postit";
  el.style.cssText = `background:${data.color}; font-family:${data.font}; width:${data.size}px; height:${data.size}px; left:${data.x}px; top:${data.y}px; transform:rotate(${data.rotate}deg);`;
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
    }
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
    if (!text || password.length !== 4) return alert("입력 오류!");

    const size = 200 + Math.max(0, text.length - 30) * 2.5;
    const existing = Array.from(document.querySelectorAll(".postit"));
    const winW = window.innerWidth;
    const winH = window.innerHeight; // 딱 현재 화면 높이
    
    let finalX, finalY, found = false;

    // 1000번 동안 오직 현재 '화면 안'에만 랜덤으로 던져봅니다.
    for (let attempts = 0; attempts < 1000; attempts++) {
      let x = Math.random() * (winW - size - 40) + 20;
      let y = Math.random() * (winH - size - 100) + 20; // 무조건 화면 안에 가두기

      if (!isOverlappingInView(x, y, size, existing, winH)) {
        finalX = x;
        finalY = y;
        found = true;
        break;
      }
    }

    // 화면이 꽉 차서 정 자리가 없으면? 겹치더라도 그냥 화면 안에 랜덤하게 둡니다.
    // (이래야 아래로 안 내려갑니다.)
    if (!found) {
      finalX = Math.random() * (winW - size - 40) + 20;
      finalY = Math.random() * (winH - size - 100) + 20;
    }

    await addDoc(collection(db, "notes"), {
      text, color: document.getElementById("colorInput").value,
      font: document.getElementById("fontInput").value,
      password, size, x: finalX, y: finalY, 
      rotate: Math.random() * 12 - 6, createdAt: Date.now()
    });

    modal.style.display = "none";
    document.getElementById("textInput").value = "";
    load();
  };
  load();
});
