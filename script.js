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

// 면적 겹침 체크 (충돌 판정)
function isOccupied(x, y) {
    const postits = document.querySelectorAll('.postit');
    for (let p of postits) {
        const px = parseFloat(p.style.left);
        const py = parseFloat(p.style.top);
        // 사각형 면적 충돌 알고리즘
        if (!(x + SIZE + 15 < px || x > px + SIZE + 15 || y + SIZE + 15 < py || y > py + SIZE + 15)) {
            return true;
        }
    }
    return false;
}

// 빈 공간 검색
function findSpot() {
    const winW = window.innerWidth;
    for (let y = 30; y < 10000; y += 40) {
        for (let x = 15; x < winW - SIZE - 15; x += 40) {
            if (!isOccupied(x, y)) return { x, y };
        }
    }
    return { x: 30, y: 30 };
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
    
    // 최종 글꼴 적용 로직
    el.style.fontFamily = data.font || "'Nanum Pen Script', cursive";
    
    el.style.transform = `rotate(${data.rotate || 0}deg)`;
    el.innerText = data.text;

    const trash = document.createElement('span');
    trash.className = 'trash'; trash.innerHTML = '🗑️';
    trash.onclick = async (e) => {
        e.stopPropagation();
        const pw = prompt("비밀번호를 입력하세요.");
        if (pw === data.password || pw === "87524") {
            await deleteDoc(doc(db, "notes", id));
            el.remove();
        }
    };
    el.appendChild(trash);
    board.appendChild(el);
}

async function load() {
    const snap = await getDocs(query(collection(db, "notes"), orderBy("createdAt", "asc")));
    snap.forEach(d => render(d.data(), d.id));
}

// 이벤트 초기화
document.getElementById('addPostitBtn').onclick = () => document.getElementById('modal').style.display = 'block';
document.getElementById('modal').onclick = (e) => { if(e.target.id === 'modal') e.target.style.display = 'none'; };

document.getElementById('savePostit').onclick = async () => {
    const text = document.getElementById('textInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const font = document.getElementById('fontInput').value; // 글꼴 값 획득
    const color = document.getElementById('colorInput').value;

    if(!text || password.length < 4) return alert("내용과 비번 4자리를 확인하세요!");

    const pos = findSpot();
    const docData = {
        text, password, font, color,
        x: pos.x, y: pos.y,
        rotate: Math.random() * 8 - 4,
        createdAt: Date.now()
    };
    
    const docRef = await addDoc(collection(db, "notes"), docData);
    render(docData, docRef.id);
    document.getElementById('modal').style.display = 'none';
    document.getElementById('textInput').value = '';
    document.getElementById('passwordInput').value = '';
};

load();
