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
const ADMIN_CODE = "87524";
const SIZE = 160;

// 겹침 검사 (오직 저장된 절대 좌표값만 비교)
function isColliding(x, y) {
    const postits = document.querySelectorAll('.postit');
    const margin = 10;
    
    for (let p of postits) {
        const pX = parseFloat(p.style.left);
        const pY = parseFloat(p.style.top);

        if (!(x + SIZE + margin < pX || 
              x > pX + SIZE + margin || 
              y + SIZE + margin < pY || 
              y > pY + SIZE + margin)) {
            return true;
        }
    }
    return false;
}

// 빈 공간 찾기 (보드 전체 영역 수색)
function findSpot() {
    const winW = window.innerWidth;
    // 현재 보드의 전체 높이를 기준으로 빈틈 수색
    const boardH = Math.max(document.getElementById("board").scrollHeight, window.innerHeight);
    
    for (let y = 20; y < boardH + 1000; y += 30) {
        for (let x = 20; x < winW - SIZE - 20; x += 30) {
            if (!isColliding(x, y)) {
                return { x, y };
            }
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
    
    // 절대 좌표 고정 (이 값들은 스크롤해도 변하지 않습니다)
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

        const pos = findSpot();

        const docRef = await addDoc(collection(db, "notes"), {
            text, color: document.getElementById("colorInput").value,
            font: document.getElementById("fontInput").value,
            password, x: pos.x, y: pos.y, 
            rotate: Math.random() * 8 - 4, createdAt: Date.now()
        });

        render({
            text, color: document.getElementById("colorInput").value, 
            font: document.getElementById("fontInput").value, 
            password, x: pos.x, y: pos.y,
            rotate: 0 
        }, docRef.id);
        
        modal.style.display = "none";
        document.getElementById("textInput").value = "";
    };
    load();
});
