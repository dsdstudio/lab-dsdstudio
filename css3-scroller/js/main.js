$(function() {
	function randomColor() {
	    var t0 = '0123456789ABCDEF'.split('');
	    var t1 = '#';
	    for (var i = 0; i < 6; i++ ) {
	        t1 += t0[Math.floor(Math.random() * 16)];
	    }
	    return t1;
	}
	var $body = $("body");
	for(var i=0;i<1000;i++) {
		$("<div />").attr({	"class":"card", "id":"card" + i
			})
			.css("background-color", randomColor())
			.appendTo("body")
			.bind("click", function(e){
				e.stopPropagation();
				console.log($(this));
			});
	}
});
