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

function isOverlapping(x, y, size, existingPostits) {
  const margin = 10;
  for (let p of existingPostits) {
    const ex = parseFloat(p.style.left);
    const ey = parseFloat(p.style.top);
    const es = parseFloat(p.style.width);
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
    if (!text || password.length !== 4) return alert("글귀와 4자리 비밀번호를 입력하세요!");

    const size = 200 + Math.max(0, text.length - 30) * 2.5;
    const existing = Array.from(document.querySelectorAll(".postit"));
    
    // [핵심 변경] 기준 좌표를 '전체 보드'가 아니라 '현재 보이는 화면 높이'로 제한
    const winW = window.innerWidth;
    const winH = window.innerHeight; 
    
    let finalX, finalY, found = false;

    // 현재 화면 높이(winH) 안에서만 500번 빈틈을 찾아봅니다.
    for (let attempts = 0; attempts < 500; attempts++) {
      let x = Math.random() * (winW - size - 40) + 20;
      let y = Math.random() * (winH - size - 60) + 20; // winH를 넘지 않게 설정

      if (!isOverlapping(x, y, size, existing)) {
        finalX = x;
        finalY = y;
        found = true;
        break;
      }
    }

    // 만약 화면 안에 자리가 정말 없으면 그제서야 아래쪽 빈틈을 찾습니다.
    if (!found) {
      const boardH = document.getElementById("board").scrollHeight;
      for (let attempts = 0; attempts < 300; attempts++) {
        let x = Math.random() * (winW - size - 40) + 20;
        let y = Math.random() * (boardH + 200); 
        if (!isOverlapping(x, y, size, existing)) {
          finalX = x; finalY = y; found = true; break;
        }
      }
    }

    // 그래도 없으면 어쩔 수 없이 맨 아래 추가
    if (!found) {
      finalX = Math.random() * (winW - size - 40) + 20;
      finalY = document.getElementById("board").scrollHeight + 20;
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
  load();
});

