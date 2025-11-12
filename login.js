function login(){
    const username = 
    document.getElementById('username').value;
    const password =
    document.getElementById('password').value;
    
    const users = {
        "teacher1": "1234",
        "technician": "tp1234"
    };
    if (users[username] && users[username] === password){
        message.style.color = "green";
        message.innerText = "Login Successfully";
    }
    else{
        message.style.color = "red";
        message.innerText = "Username or Password Wrong";
    }
}