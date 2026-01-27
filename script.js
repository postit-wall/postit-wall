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
const MARGIN = 15;
const ADMIN_CODE = "87524";

// 보드 크기를 포스트잇 위치에 맞춰 자동 확장
function updateBoardSize() {
    const postits = document.querySelectorAll('.postit');
    let maxBottom = window.innerHeight;
    let maxRight = window.innerWidth;

    postits.forEach(p => {
        const b = parseFloat(p.style.top) + SIZE + 100;
        const r = parseFloat(p.style.left) + SIZE + 50;
        if (b > maxBottom) maxBottom = b;
        if (r > maxRight) maxRight = r;
    });

    const board = document.getElementById("board");
    board.style.height = maxBottom + "px";
    board.style.width = maxRight + "px";
}

// 면적 기반 겹침 체크 알고리즘
function isOccupied(x, y) {
    const existing = document.querySelectorAll('.postit');
    for (let p of existing) {
        const px = parseFloat(p.style.left);
        const py = parseFloat(p.style.top);
        // 사각형 면적 충돌 판정
        if (!(x + SIZE + MARGIN < px || x > px + SIZE + MARGIN || 
              y + SIZE + MARGIN < py || y > py + SIZE + MARGIN)) {
            return true;
        }
    }
    return false;
}

// 빈틈을 찾을 때까지 격자 수색
function findEmptySpace() {
    const winW = window.innerWidth;
    const boardH = Math.max(document.getElementById("board").scrollHeight, 2000);
    
    for (let y = 20; y < boardH; y += 25) {
        for (let x = 20; x < winW - SIZE - 20; x += 25) {
            if (!isOccupied(x, y)) return { x, y };
        }
    }
    return { x: 20, y: 20 };
}

function renderPostit(data, id) {
    if (document.getElementById(id)) return;
    const board = document.getElementById("board");
    const el = document.createElement("div");
    el.className = "postit";
    el.id = id;
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
        const pw = prompt("비밀번호를 입력하세요.");
        if (pw === data.password || pw === ADMIN_CODE) {
            await deleteDoc(doc(db, "notes", id));
            el.remove();
            updateBoardSize();
        }
    };
    el.appendChild(trash);
    board.appendChild(el);
    updateBoardSize();
}

async function load() {
    const q = query(collection(db, "notes"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    snap.forEach(d => renderPostit(d.data(), d.id));
}

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal");
    const addBtn = document.getElementById("addPostitBtn");
    const saveBtn = document.getElementById("savePostit");

    addBtn.onclick = () => { modal.style.display = "block"; };
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

    saveBtn.onclick = async () => {
        const text = document.getElementById("textInput").value.trim();
        const password = document.getElementById("passwordInput").value;
        const color = document.getElementById("colorInput").value;
        const font = document.getElementById("fontInput").value;

        if (!text || password.length !== 4) return alert("내용과 비밀번호 4자리를 확인해주세요!");

        const pos = findEmptySpace();

        const docRef = await addDoc(collection(db, "notes"), {
            text, color, font, password,
            x: pos.x, y: pos.y, 
            rotate: Math.random() * 6 - 3,
            createdAt: Date.now()
        });

        renderPostit({text, color, font, password, x: pos.x, y: pos.y}, docRef.id);
        modal.style.display = "none";
        document.getElementById("textInput").value = "";
    };

    load();
});
