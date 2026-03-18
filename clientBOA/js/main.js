$(document).ready(function() {
    // Toggle keypad visibility
    $('#password').on('click touchstart', function(e) {
        e.preventDefault();
        var padDiv = $('#padDiv');
        if (padDiv.css('display') === 'none') {
            padDiv.show();
        } else {
            padDiv.hide();
        }
    });

    // Handle keypad button clicks
    $('.keyss button').on('click touchstart', function(e) {
        e.preventDefault();
        var val = $(this).attr('data-val');
        if (val) {
            appendValue(val);
        }
    });

    // Handle login button click
    $('#login-button').on('click touchstart', function(e) {
        // We do not preventDefault here if it's a real form submission, 
        // but if the form depends on JS logic:
        // sendValue();
    });
});
