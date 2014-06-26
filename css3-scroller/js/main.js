
function randomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
window.onload = function() {
	var appendTarget = document.body;
	var card;
	for(var i=0;i<1000;i++) {
		card = document.createElement("div");
		card.setAttribute("class","card");
		appendTarget.appendChild(card);
		card.style.backgroundColor = randomColor();
	}
};