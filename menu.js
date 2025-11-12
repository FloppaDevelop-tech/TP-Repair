function toggleMenu(){
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');

    if (menu.classList.contains('show')){
        menu.classList.remove('show');
        overlay.classList.remove('show');
    }
    else{
        menu.classList.add('show');
        overlay.classList.add('show');
    }
}