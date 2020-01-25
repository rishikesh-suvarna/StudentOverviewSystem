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

