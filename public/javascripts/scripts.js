$(".delete-form").click(function(){
    return confirm("Are you sure?");
});

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});

$('#inputGroupFile01').on('change',function(){
    //get the file name
    var fileName = $(this).val().replace('C:\\fakepath\\', " ");
    //replace the "Choose a file" label
    $(this).next('.custom-file-label').html(fileName);
});

// $(window).on("load", function(){
//     $('.spinner-grow').fadeOut(3000);
// });

// function unhideFunction() {
//     var x = document.getElementsByID("pswd");
//     if (x.type === "password") {
//       x.type = "text";
//     } else {
//       x.type = "password";
//     }
//   }

$("#eyep").click(function(){
    var x = document.getElementById("changep");
    if(x.type === "password"){
        $("#changep").attr("type", "text");
        $("#iconp").removeClass("fa-eye").addClass("fa-eye-slash");
    } else {
        $("#changep").attr("type", "password");
        $("#iconp").addClass("fa-eye").removeClass("fa-eye-slash");
    }
});

$("#eyecp").click(function(){
    var y = document.getElementById("changecp");
    if(y.type === "password"){
        $("#changecp").attr("type", "text");
        $("#iconcp").removeClass("fa-eye").addClass("fa-eye-slash");
    } else {
        $("#changecp").attr("type", "password");
        $("#iconcp").addClass("fa-eye").removeClass("fa-eye-slash");
    }
});


$(document).ready(function(){
    $(".hover").hover(
        function(){
            $(this).animate({
                marginTop: "-=1%",
            },200);
        },

        function(){
            $(this).animate({
                marginTop: "0%"
            },200);
        }
    );
});
