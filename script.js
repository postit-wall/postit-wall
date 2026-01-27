import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCtEtTKT_ay0KZoNw6kxiWt_RkI6L2UvKQ",
    authDomain: "postit-wall-7ba23.firebaseapp.com",
    projectId: "postit-wall-7ba23",
    storageBucket: "postit-wall-7ba23.appspot.com",
    messagingSenderId: "447459662497",
    appId: "1:447459662497:web:73ebd7b62d08ca6f12aee0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const SIZE = 160;

// 보드의 실제 높이를 포스트잇 위치에 맞춰 강제로 늘리는 함수
function updateBoardHeight() {
    const postits = document.querySelectorAll('.postit');
    let maxBottom = window.innerHeight;

    postits.forEach(p => {
        const bottom = parseFloat(p.style.top) + SIZE + 100; // 아래 여백 100px 추가
        if (bottom > maxBottom) maxBottom = bottom;
    });

    const board = document.getElementById('board');
    board.style.height = maxBottom + "px"; // 보드 높이를 갱신해서 배경을 채움
}

function isOverlapping(x, y) {
    const postits = document.querySelectorAll('.postit');
    for (let p of postits) {
        const px = parseFloat(p.style.left);
        const py = parseFloat(p.style.top);
        if (!(x + SIZE + 15 < px || x > px + SIZE + 15 || y + SIZE + 15 < py || y > py + SIZE + 15)) {
            return true;
        }
    }
    return false;
}

function findSpot() {
    const winW = window.innerWidth;
    for (let y = 20; y < 10000; y += 40) {
        for (let x = 10; x < winW - SIZE - 10; x += 40) {
            if (!isOverlapping(x, y)) return { x, y };
        }
    }
    return { x: 20, y: 20 };
}

function render(data, id) {
    if (document.getElementById(id)) return;
    const board = document.getElementById('board');
    const el = document.createElement('div');
    el.className = 'postit';
    el.id = id;
    el.style.left = `${data.x}px`;
    el.style.top = `${data.y}px`;
    el.style.backgroundColor = data.color;
    el.style.transform = `rotate(${data.rotate || 0}deg)`;
    el.innerText = data.text;

    const trash = document.createElement('span');
    trash.className = 'trash'; trash.innerHTML = '🗑️';
    trash.onclick = async (e) => {
        e.stopPropagation();
        if (prompt("비번") === data.password || prompt("관리자") === "87524") {
            await deleteDoc(doc(db, "notes", id));
            el.remove();
            updateBoardHeight(); // 삭제 후에도 높이 재계산
        }
    };
    el.appendChild(trash);
    board.appendChild(el);
    
    updateBoardHeight(); // 포스트잇이 추가될 때마다 보드 높이 확장
}

async function load() {
    const snap = await getDocs(query(collection(db, "notes"), orderBy("createdAt", "asc")));
    snap.forEach(d => render(d.data(), d.id));
}

document.getElementById('addPostitBtn').onclick = () => document.getElementById('modal').style.display = 'block';
document.getElementById('modal').onclick = (e) => { if(e.target.id === 'modal') e.target.style.display = 'none'; };

document.getElementById('savePostit').onclick = async () => {
    const text = document.getElementById('textInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    if(!text || password.length < 4) return alert("비번 4자리 확인!");

    const pos = findSpot();
    const docData = {
        text, password, x: pos.x, y: pos.y,
        color: document.getElementById('colorInput').value,
        rotate: Math.random() * 8 - 4,
        createdAt: Date.now()
    };
    const docRef = await addDoc(collection(db, "notes"), docData);
    render(docData, docRef.id);
    document.getElementById('modal').style.display = 'none';
    document.getElementById('textInput').value = '';
};

load();
