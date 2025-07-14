document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('taskModal');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const saveTaskBtn = document.getElementById('saveTask');
  const taskTitle = document.getElementById('taskTitle');
  const taskStatus = document.getElementById('taskStatus');
  const subtasksContainer = document.getElementById('subtasksContainer');
  const addSubtaskBtn = document.getElementById('addSubtask');
  const addColumnBtn = document.getElementById('addColumnBtn');
  const sidebar = document.getElementById('sidebar');
  const showSidebarBtn = document.getElementById('showSidebar');
  const themeToggle = document.getElementById('theme');
  const boardList = document.getElementById('boardList');
  const createBoardBtn = document.getElementById('createBoard');
  const boardTitle = document.getElementById('boardTitle');
  const allBoardsCount = document.getElementById('allBoardsCount');
  const editBoardBtn = document.getElementById('editBoardBtn');

  let selectedBoard = "Platform Launch";
  let draggedData = null;

  // ✅ Ensure default board exists with default columns
  let allBoards = JSON.parse(localStorage.getItem('kanbanData') || '{}');
  if (!allBoards["Platform Launch"]) {
    allBoards["Platform Launch"] = {
      "TODO": [],
      "DOING": [],
      "DONE": []
    };
    localStorage.setItem('kanbanData', JSON.stringify(allBoards));
  }

  // ✅ Make existing boards in sidebar clickable
  document.querySelectorAll('#boardList li:not(#createBoard)').forEach(li => {
    li.onclick = () => selectBoard(li, li.dataset.board);
  });

  addTaskBtn.onclick = () => {
    refreshSelectOptions();
    subtasksContainer.innerHTML = '';
    modal.style.display = 'flex';
  };

  modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

  addSubtaskBtn.onclick = () => {
    const input = document.createElement('input');
    input.type = "text";
    input.placeholder = "Subtask";
    subtasksContainer.appendChild(input);
  };

  saveTaskBtn.onclick = () => {
    const title = taskTitle.value.trim();
    if (!title) return;
    const status = taskStatus.value;
    const subs = Array.from(subtasksContainer.querySelectorAll('input')).map(i=>i.value).filter(Boolean);
    createTask(title, status, subs);
    modal.style.display = 'none';
    taskTitle.value = '';
    subtasksContainer.innerHTML = '';
    updateCounts();
    saveData();
  };

  function refreshSelectOptions() {
    taskStatus.innerHTML = '';
    document.querySelectorAll('.column').forEach(col => {
      const opt = document.createElement('option');
      opt.value = col.dataset.status;
      opt.textContent = col.querySelector('h4').textContent;
      taskStatus.appendChild(opt);
    });
  }

  function createTask(title, status, subtasks=[]) {
    const task = document.createElement('div');
    task.className = 'task';
    task.draggable = true;

    const taskTitleDiv = document.createElement('div');
    taskTitleDiv.textContent = title;

    const subtaskCountDiv = document.createElement('div');
    subtaskCountDiv.style.fontSize = '0.8em';
    subtaskCountDiv.style.color = 'gray';
    subtaskCountDiv.textContent = `${subtasks.length} subtasks`;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '❌';
    deleteBtn.style.float = 'right';
    deleteBtn.style.border = 'none';
    deleteBtn.style.background = 'transparent';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.onclick = () => {
      task.remove();
      updateCounts();
      saveData();
    };

    task.appendChild(taskTitleDiv);
    task.appendChild(subtaskCountDiv);
    task.appendChild(deleteBtn);

    task.ondragstart = () => draggedData = {title, subtasks};
    document.querySelector(`.column[data-status="${status}"] .tasks`).appendChild(task);
  }

  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    const col = e.target.closest('.column');
    if (col && draggedData) {
      createTask(draggedData.title, col.dataset.status, draggedData.subtasks);
      removeTask(draggedData.title);
      updateCounts();
      saveData();
      draggedData = null;
    }
  });

  function removeTask(title) {
    document.querySelectorAll('.task').forEach(task => {
      if (task.textContent.includes(title)) task.remove();
    });
  }

  addColumnBtn.onclick = () => {
    const name = prompt("Column name:");
    if (!name) return;

    const existingColumns = Array.from(document.querySelectorAll('.column h4'))
      .map(h4 => h4.textContent.split(' ')[0].toLowerCase());
    if (existingColumns.includes(name.toLowerCase())) {
      alert("A column with this name already exists!");
      return;
    }

    const status = name.toUpperCase();
    const col = document.createElement('div');
    col.className = 'column';
    col.dataset.status = status;
    col.innerHTML = `<h4>${status} <span class="count">(0)</span></h4><div class="tasks"></div>`;
    document.getElementById('board').insertBefore(col, document.querySelector('.add-column'));
    refreshSelectOptions();
    updateCounts();
    saveData();
  };

  createBoardBtn.addEventListener('click', () => {
    const name = prompt("Enter new board name:");
    if (!name) return;

    const existingBoards = Array.from(boardList.querySelectorAll('li:not(#createBoard)'))
      .map(li => li.dataset.board.toLowerCase());
    if (existingBoards.includes(name.toLowerCase())) {
      alert("A board with this name already exists!");
      return;
    }

    // ✅ Initialize new board with default columns
    let allBoards = JSON.parse(localStorage.getItem('kanbanData') || '{}');
    allBoards[name] = {
      "TODO": [],
      "DOING": [],
      "DONE": []
    };
    localStorage.setItem('kanbanData', JSON.stringify(allBoards));

    const li = document.createElement('li');
    li.textContent = name;
    li.dataset.board = name;
    li.onclick = () => selectBoard(li, name);
    boardList.insertBefore(li, createBoardBtn);
    li.click();
    updateBoardCount();
  });

  function selectBoard(li, name) {
    saveData(); // ✅ save current board before switching
    selectedBoard = name;
    document.querySelectorAll('#boardList li').forEach(item => item.classList.remove('active'));
    li.classList.add('active');
    boardTitle.textContent = selectedBoard;
    loadBoardData();
  }

  editBoardBtn.onclick = () => {
    const action = prompt(`Type 'rename' to rename or 'delete' to delete this board:`);
    if (!action) return;

    if (action === 'rename') {
      const newName = prompt("New board name:");
      if (!newName) return;

      let allBoards = JSON.parse(localStorage.getItem('kanbanData') || '{}');
      allBoards[newName] = allBoards[selectedBoard] || {
        "TODO": [], "DOING": [], "DONE": []
      };
      delete allBoards[selectedBoard];
      localStorage.setItem('kanbanData', JSON.stringify(allBoards));

      selectedBoard = newName;
      const li = document.querySelector('#boardList .active');
      li.textContent = newName;
      li.dataset.board = newName;
      boardTitle.textContent = newName;
      updateBoardCount();
      saveData();
    } else if (action === 'delete') {
      if (confirm("Delete this board?")) {
        const li = document.querySelector('#boardList .active');
        li.remove();
        deleteBoardData(selectedBoard);
        const firstBoard = document.querySelector('#boardList li:not(#createBoard)');
        if (firstBoard) firstBoard.click();
        updateBoardCount();
      }
    }
  };

  function deleteBoardData(boardName) {
    let allBoards = JSON.parse(localStorage.getItem('kanbanData') || '{}');
    delete allBoards[boardName];
    localStorage.setItem('kanbanData', JSON.stringify(allBoards));
  }

  function loadBoardData() {
    document.querySelectorAll('.column').forEach(col => col.remove());

    let allBoards = JSON.parse(localStorage.getItem('kanbanData') || '{}');
    if (!allBoards[selectedBoard]) {
      allBoards[selectedBoard] = {"TODO": [], "DOING": [], "DONE": []};
      localStorage.setItem('kanbanData', JSON.stringify(allBoards));
    }
    const boardData = allBoards[selectedBoard];

    for (let status in boardData) {
      let tasks = boardData[status];
      const col = document.createElement('div');
      col.className = 'column';
      col.dataset.status = status;
      col.innerHTML = `<h4>${status} <span class="count">(0)</span></h4><div class="tasks"></div>`;
      document.getElementById('board').insertBefore(col, document.querySelector('.add-column'));
      tasks.forEach(({title, subtasks}) => createTask(title, status, subtasks));
    }

    refreshSelectOptions();
    updateCounts();
  }

  function updateCounts() {
    document.querySelectorAll('.column').forEach(col => {
      col.querySelector('.count').textContent = `(${col.querySelectorAll('.task').length})`;
    });
  }

  function updateBoardCount() {
    const count = boardList.querySelectorAll('li:not(#createBoard)').length;
    allBoardsCount.textContent = `All Boards (${count})`;
  }

  document.getElementById('hideSidebar').onclick = () => {
    sidebar.classList.add('collapsed');
    showSidebarBtn.style.display = 'block';
  };
  showSidebarBtn.onclick = () => {
    sidebar.classList.remove('collapsed');
    showSidebarBtn.style.display = 'none';
  };

  themeToggle.onchange = () => {
    document.body.classList.toggle('dark', themeToggle.checked);
    localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
  };
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeToggle.checked = true;
  }

  loadBoardData();
  updateBoardCount();
});
