$(function () {
    "use strict";
    // Document ready.

    var charMap = {
        'á': 'a',
        'č': 'c',
        'ď': 'd',
        'é': 'e',
        'ě': 'e',
        'í': 'i',
        'ň': 'n',
        'ó': 'o',
        'ř': 'r',
        'š': 's',
        'ť': 't',
        'ú': 'u',
        'ů': 'u',
        'ý': 'y',
        'ž': 'z',
        'Á': 'A',
        'Č': 'C',
        'Ď': 'D',
        'É': 'E',
        'Ě': 'E',
        'Í': 'I',
        'Ň': 'N',
        'Ó': 'O',
        'Ř': 'R',
        'Š': 'S',
        'Ť': 'T',
        'Ú': 'U',
        'Ů': 'U',
        'Ý': 'Y',
        'Ž': 'Z'
    };

    var contentWrapper = $('.content-wrapper');
    var canvas = document.createElement("canvas");
    var mobileMenuApi = undefined;

    /** Init Mobile menu **/
    var mobileMenu = $('#ditap-mobile-menu');
    if (mobileMenu.length !== 0) {
        mobileMenuApi = initMMenu(mobileMenu);
        // Assign back btn text
        $('.mm-btn_prev').text(mobileMenu.data('btn-back'));
        // Must init product category panel manually
        mobileMenuApi.initPanels($('#mm-4'));
    }

    /** Refresh Bootstrap select **/
    $('.selectpicker').selectpicker('refresh');

    /** Init homepage carousel **/
    if (contentWrapper.hasClass('homepage')) {
        var carousel = $('#ditap-carousel');
        initCarousel(carousel[0]);
    }

    /** Init slick sliders **/
    initSlickSliders();

    /** Init inpage navigation **/
    initInpageNav();

    /** Scroll to anchor if hash is available **/
    var urlHash = location.hash;
    if (urlHash.length !== 0 && $(urlHash).length !== 0) {
        scrollToAnchor(urlHash, 70);
    }

    /** Check Image Banner Lightness to dynamically set text color **/
    var bannerElements = $('.img-banner-ditap');
    if (bannerElements.length !== 0) {
        checkBannerImagesLightness(bannerElements);
    }

    /** Init typeahead search **/
    var searchModal = $('#searchModal');
    var ditapTips = undefined;
    var searchResultItem = undefined;
    var totalSearchResults = undefined;
    var resultList = $('<ul class="search-tips-ditap"></ul>');
    // Typeahead search @see http://twitter.github.io/typeahead.js/examples/
    var processSearch = new Bloodhound({
        datumTokenizer: function (d) {
            return Bloodhound.tokenizers.whitespace(d.tokens.join(' '));
        },
        //queryTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: function (q) {
            var normalized = normalizeChar(q);
            return Bloodhound.tokenizers.whitespace(normalized);
        },
        prefetch: {
            url: 'js/data/search.json',
            filter: function (data) {
                totalSearchResults = data[0].totalResults;
                for (var i = 0; i < data[0].quickResults.length; i++) {
                    var tokensNormalized = [];
                    $.map(data[0].quickResults[i].tokens, function (name) {
                        // Normalize the name - use this for searching
                        var normalized = normalizeChar(name);
                        tokensNormalized.push(normalized);
                        data[0].quickResults[i].tokens = tokensNormalized;
                    });
                }
                return data[0].quickResults;
            }
        }
        // Enter here code for Kentico search URL and use %QUERY placeholder
        /*remote: {
            url: 'js/data/search.json'
            wildcard: '%QUERY'
        }*/
    });

    $('#ditapSearchInput').typeahead({
            highlight: true,
            hint: false,
            minLength: 3,
            limit: 4,
            classNames: {
                menu: 'hide' // add class name to menu so default dropdown does not show
            }
        },
        {
            name: 'searchResults',
            display: 'tokens',
            source: processSearch
        }
        // Render search results
    ).on('typeahead:render', function () {
        processSearch.clearPrefetchCache();
        var searchModalBody = $('#searchModal').find('.modal-body');
        var results = Array.prototype.slice.call(arguments, 1);
        if (results.length !== 0) {
            resultList.empty();
            $.each(results, function (index, result) {
                var listItem = searchResultItem.clone();
                listItem.find('a').attr('href', result.link);
                listItem.find('img').attr('src', result.imgUrl);
                listItem.find('div > span').text(result.category);
                listItem.find('div > p').text(result.title);
                resultList.append(listItem);
            });
            searchModalBody.html(resultList);
            searchModalBody.parent().find('.modal-footer .badge').text(totalSearchResults);
            searchModalBody.parent().find('.modal-footer').show();
            searchModalBody.parent().find('.btn-ditap-mini').show();
        }
    });

    //object fit
    var userAgent, ieReg, ie;
    userAgent = window.navigator.userAgent;
    ieReg = /msie|Trident.*rv[ :]*11\./gi;
    ie = ieReg.test(userAgent);

    if(ie) {
        $(".object-fit-container").each(function () {
            var $container = $(this),
                imgUrl = $container.find("img").prop("src");
            if (imgUrl) {
                $container.css("backgroundImage", 'url(' + imgUrl + ')').addClass("js-object-fit");
            }
        });
    }

    /** EVENTS ----------------------------------------------------------------------------------------------------- **/

    /* Reinit on resize / orientation change */
    $(window).on('resize orientationChange', function (event) {
        // No slick sliders on mobiles
        var slickInitialized = $('.content-wrapper').find('.slick-initialized');
        if ($(window).width() > 420 && slickInitialized.length === 0) {
            initSlickSliders();
        }

        adjustShoppingCartBackdrop();
    });

    /* Print buttons */
    // https://github.com/jasonday/printThis
    $('.btn-ditap-print').on("click", function (e) {
        e.preventDefault();
        var printContent = $(this).closest('.recipe-print').printThis({
            importCSS: false,
            importStyle: true,
            loadCSS: 'DitaP/css/ditap-print.css',
            debug: false
        });
    });

    $('.btn-ditap-print-invoice').on("click", function (e) {
        e.preventDefault();
        // window.print();
        $('.invoice-print').printThis({
            importCSS: false,
            importStyle: false,
            loadCSS: 'DitaP/css/main.css',
            debug: false
         });
    });

    /* Page scrolldown button */
    $('.arrow-scroll-down').on('click', function (e) {
        e.preventDefault();
        var offset = $(this).data('offset'),
            id = $(this).data('id');
        // Choose offset for mobile
        if( $(this).data('offset-mobile') && $(window).width() < 768 ) {
            offset = $(this).data('offset-mobile');
        }
        scrollToAnchor(id, offset);
    });

    /* Scrollspy event to actualize the bootstrap-select active element */
    $(window).on('activate.bs.scrollspy', function (e, obj) {
        if (obj !== undefined) {
            var scrollspyActiveId = obj.relatedTarget;
            $('.inpage-nav-select .selectpicker').selectpicker('val', scrollspyActiveId);
        }
    });

    // Search button Desktop
    $('.btn-search').on("click", function (e) {
        e.preventDefault();
        var searchModalElem = $('#searchModal');
        ditapTips = searchModalElem.find('.modal-body').html();
        searchResultItem = searchModalElem.find(".search-tips-ditap >:first-child");
        $(this).parent().removeClass('active');
        $(this).animate({left: '300px'}, 70, function () {
            searchModalElem.modal('show');
        });
    });

    // Search button Mobile
    $('.mm-listitem .ditap-ico_search').parent().on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var searchModalElem = $('#searchModal');
        ditapTips = searchModalElem.find('.modal-body').html();
        searchResultItem = searchModalElem.find(".search-tips-ditap >:first-child");
        searchModalElem.modal('show');
    });

    // New search button
    searchModal.find('.btn-ditap-mini').on('click', function (e) {
        e.preventDefault();
        searchModal.find('.modal-body').html(ditapTips);
        searchModal.find('.modal-footer').hide();
        $('#ditapSearchInput').typeahead('val', '').focus();
        $(this).hide();
    });

    // Close login modal if registration modal is clicked
    $('#modalRegistration').on('show.bs.modal', function () {
        $('#modalLogin').modal('hide');
    });

    // Close registration modal if login modal is clicked
    $('#modalLogin').on('show.bs.modal', function () {
        $('#modalRegistration').modal('hide');
    });

    // Multistep modal triggering
    $('.modal.multi-step').find('.btn-modal-next-step').on('click', function (e) {
        e.preventDefault();
        var modalName = $(this).data('modal'),
            currentStep = $(this).data('step'),
            nextStep = $(this).data('next-step');
        if ($(modalName).hasClass('needs-form-validation')) {
            var requiredInputs = $(modalName + ' .modal-body.step-' + currentStep).find('input[required]');
            if (requiredInputs.length !== 0) {
                doMultiStepModalValidation(modalName, requiredInputs, nextStep);
            } else {
                $(modalName).trigger('next.m.' + nextStep);
            }
        } else {
            $(modalName).trigger('next.m.' + nextStep);
        }
    });

    // Cart Modal
    $('#modalCart').on('shown.bs.modal', function () {
        adjustShoppingCartBackdrop();
        $('.btn-cart').addClass('active');
    }).on('hide.bs.modal', function() {
        $('.btn-cart').removeClass('active');
    });

    // Close Shopping cart modal when clicked outside
    $('body').on('mouseup touched',function(e){
        var clicked = $(e.target);
        if (clicked.is('.modal.shopping-cart') || clicked.parents().is('.modal.shopping-cart')) {
            return false;
        } else {
            $('.modal.shopping-cart').modal('hide');
        }
    });

    // Search Modal
    searchModal.on('hide.bs.modal', function () {
        $('.btn-search').animate({left: '0px'}, 150, function () {
            if ($('.content-wrapper').hasClass('search-results')) {
                $(this).parent().addClass('active');
            }
        });
    }).on('shown.bs.modal', function () {
        var searchInputField = $('#ditapSearchInput');
        searchInputField.focus();
        $('.modal-backdrop').addClass('search-modal-backdrop');
        // Submit search from modal and redirect to search results page
        searchInputField.on('keyup', function (e) {
            if (e.which === 13 && $(this).val().length >= 3) {
                var query = $(this).val();
                // !!! This links has to be changed to Kentico search page !!!
                if (query === 'kralik' || query === 'králik') {
                    window.location.href = 'search2.html?searchtext=' + query;
                } else {
                    window.location.href = 'search-no-results2.html?searchtext=' + query;
                }
            }
        });
    });

    // E-Shop menu toggle backdrop
    $('.dropdown-eshop-ditap').on('show.bs.dropdown', function () {
        $('.ditap-backdrop-overlay').fadeIn(250);
    }).on('hidden.bs.dropdown', function () {
        $('.ditap-backdrop-overlay').fadeOut(250);
    });

    // E-Shop submenu toggle
    $('.btn-eshop-submenu').on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).parent().toggleClass('show');
        $(this).next('.dropdown-menu').toggleClass('show');
    });

    // E-Shop category menu close
    $('.category-submenu .close').on('click', function (e) {
        e.stopPropagation();
        $('.nav-item.dropdown').removeClass('show');
        $('.btn-eshop-submenu').trigger('click');
    });

    // Mmenu category menu trigger (mobile)
    $('.mm-listitem .btn-eshop-submenu').on('click', function (e) {
        e.preventDefault();
        $(this).parent().find('.mm-btn_next').trigger('click');
    });

    // Trigger image zoom on button hover
    $('.btn-ditap.image-zoom-fast').on('mouseenter mouseleave', function (e) {
        imageZoomFast(this, e);
    });

    // Trigger image zoom on image banners
    $('.banner-zoom.image-zoom-slow').on('mouseenter mouseleave', function (e) {
        imageZoom(this, e);
    });

    $('.banner-zoom.image-zoom-fast').on('mouseenter mouseleave', function (e) {
        imageZoomFast(this, e);
    });

    // Popover sliders on Diary and Recipe pages
    $('.btn-ditap-teaser-cart-big').on('click', function (e) {
        // Use direct link for mobiles or show product slider card on tablets or desktops
        if ($(window).width() > 767) {
            e.preventDefault();
            var popover = $(this).parent().closest('.vkpopup'),
                popoverHidden = $(popover).find('.slider-product-popover').hasClass('hide');
            // Show or hide popover slider
            if (popoverHidden) {
                $(this).addClass('active');
                $(popover).find('.popover-intro').addClass('hide');
                $(popover).find('.arrow').removeClass('hide');
                $(popover).find('.popover-body').removeClass('hide');
                $(popover).find('.slider-product-popover').removeClass('hide').slick({
                    prevArrow: '<a href="#" class="nav-link icon-link slick-prev"><span class="icon-ditap-arrow arrow-left"></span></a>',
                    nextArrow: '<a href="#" class="nav-link icon-link slick-next"><span class="icon-ditap-arrow arrow-right"></span></a>',
                    variableWidth: false,
                    mobileFirst: true,
                    slidesToShow: 1,
                    dots: true,
                    arrows: true,
                    infinite: true
                });
            } else {
                $(this).removeClass('active');
                // Hide the popover slider
                $(popover).find('.popover-body').addClass('hide');
                $(popover).find('.arrow').addClass('hide');
                $(popover).find('.slider-product-popover').addClass('hide').slick('unslick');
            }
        }
    });

    // Popover close button
    $('.popover-intro').find('button.close').on('click', function(e) {
        e.preventDefault();
        var popover = $(this).parent().closest('.vkpopup');
        $(popover).find('.popover-intro').addClass('hide');
    });

    /** FUNCTIONS -------------------------------------------------------------------------------------------------- **/

    function initMMenu(mmenuElem) {
        return mmenuElem.mmenu({
            // options
            offCanvas: true,
            navbar: {
                title: "<img src=\"DitaP/media/DitaP/logos/logo_ditap.svg\" alt=\"Dita P.\"/>"
            },
            wrappers: ["bootstrap4"],
            extensions: [
                "fullscreen",
                "fx-menu-fade",
                "position-front",
                "theme-white"
            ],
            navbars: [
                {
                    position: "top",
                    content: [
                        "prev",
                        "title",
                        "close"
                    ]
                }
            ]
        }, {
            // configuration
            // clone: true,
            offCanvas: {
                pageSelector: ".content-wrapper"
            }
        }).data("mmenu");
    }

    function initCarousel(carousel) {
        $(carousel).carousel({});
        checkImageLightness($('.carousel-item.active img')[0].src, carousel);
        //Events that reset and restart the timer animation when the slides change
        $(carousel).on("slide.bs.carousel", function (e) {
            $('.teaser-cards-promo').fadeOut(750);
            var currentIndex = $(e.relatedTarget).index();
            checkImageLightness($('.carousel-item img')[currentIndex].src, carousel);
            //The animate class gets removed so that it jumps straight back to 0%
            $(".transition-timer-carousel-progress-bar", this).removeClass("animate").css("width", "0%");
        }).on("slid.bs.carousel", function () {
            //The slide transition finished, so re-add the animate class so that
            //the timer bar takes time to fill up
            $(".transition-timer-carousel-progress-bar", this).addClass("animate").css("width", "100%");
            $('.teaser-cards-promo').fadeIn();
        });
        // Kick off the initial slide animation when the document is ready
        $(".transition-timer-carousel-progress-bar", carousel).css("width", "100%");
    }

    function adjustShoppingCartBackdrop() {
        // Adjust the modal backdrop of the Shopping cart so that header is not covered
        if( $(window).width() < 767 ) {
            $('.modal-backdrop').css({top: '70px'});
        }

        if( $(window).width() > 767 ) {
            $('.modal-backdrop').css({top: '130px'});
        }
        if( $(window).width() > 992 ) {
            $('.modal-backdrop').css({top: '160px'});
        }
    }

    function checkBannerImagesLightness(bannerElements) {
        var bannerImages = $(bannerElements).find('img');
        for (var i = 0; i < bannerImages.length; i++) {
            if (bannerImages[i].complete || bannerImages[i].readyState === 4) {
                // Image is cached
                checkImageLightness($(bannerImages[i]).attr('src'), $(bannerImages[i]).parent()[0]);
            }
            else {
                // Image is not cached
                $(bannerImages[i]).on('load', function () {
                    //checkImageLightness(e.target.src, $(e.target).parent()[0]);
                    checkImageLightness($(this).attr('src'), $(this).parent()[0]);
                });
            }
        }
    }

    function checkImageLightness(image, elem) {
        getImageLightness(image, function (lightness) {
            if (lightness > 200) {
                $(elem).addClass('background--light');
            } else {
                $(elem).removeClass('background--light');
            }
        });
    }

    function getImageLightness(imageSrc, callback) {
        var testImg = document.createElement('img');
        testImg.src = imageSrc;
        testImg.style.display = "none";
        var colorSum = 0;
        testImg.onload = function () {
            // create canvas
            canvas.width = this.width;
            canvas.height = this.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imageData.data;
            var r, g, b, avg;
            for (var x = 0, len = data.length; x < len; x += 4) {
                r = data[x];
                g = data[x + 1];
                b = data[x + 2];

                avg = Math.floor((r + g + b) / 3);
                colorSum += avg;
            }
            var brightness = Math.floor(colorSum / (this.width * this.height));
            setTimeout(callback(brightness), 500);
        }
    }

    function normalizeChar(char) {
        $.each(charMap, function (unnormalizedChar, normalizedChar) {
            var regex = new RegExp(unnormalizedChar, 'gi');
            char = char.replace(regex, normalizedChar);
        });
        return char;
    }

    function imageZoom(element, event) { //@Todo: Remove code duplication and refactor to use a mode parameter
        switch (event.type) {
            case 'mouseenter':
                $(element).closest('.card-panel').parent().find('img').addClass('img-zoom-in');
                // In case of Banners
                $(element).find('img').addClass('img-zoom-in');
                break;
            case 'mouseleave':
                $(element).closest('.card-panel').parent().find('img').removeClass('img-zoom-in');
                // In case of Banners
                $(element).find('img').removeClass('img-zoom-in');
                break;
            default:
                $(element).closest('img').removeClass('img-zoom-in');
                // In case of Banners
                $(element).find('img').removeClass('img-zoom-in');
        }
    }

    function imageZoomFast(element, event) { //@Todo: Remove code duplication
        switch (event.type) {
            case 'mouseenter':
                $(element).closest('.card-panel').parent().find('img').addClass('img-zoom-in-fast');
                // In case of Banners
                $(element).find('img').addClass('img-zoom-in-fast');
                break;
            case 'mouseleave':
                $(element).closest('.card-panel').parent().find('img').removeClass('img-zoom-in-fast');
                // In case of Banners
                $(element).find('img').removeClass('img-zoom-in-fast');
                break;
            default:
                $(element).closest('img').removeClass('img-zoom-in-fast');
                // In case of Banners
                $(element).find('img').removeClass('img-zoom-in-fast');
        }
    }

    /**
     *  Function to scroll to an anchor tag with offset
     *
     * @param <String> hash       Hashtag from the url, e.g. #faq1
     * @param <Number> offset     Offset when scrolling in pixel, e.g. 70
     */
    function scrollToAnchor(hash, offset) {
        $('html, body').animate({
            scrollTop: $(hash).offset().top - offset
        }, 500, function () {
            // Open the accordion tab after scroll finished on shopping guide page
            if (contentWrapper.hasClass('shopping-guide')) {
                openShoppingGuideAccordianTab(hash);
            }
        });
    }

    /**
     *
     * @param String hash   Hashtag from the url, e.g. #faq1
     */
    function openShoppingGuideAccordianTab(hash) {
        $(hash).parent().find('.collapse').addClass('show').parent().find('a').attr('aria-expanded', 'true');
    }

    /**
     * Initializes clientside form-validation with bootstrap
     * Can be used if needed
     */
    function initFormValidation() {

        var forms = $('.needs-form-validation');
        // Event handler On Submit
        forms.on('submit', function (ev) {
            // Using 'this' we get the form which is actually beeing submitted
            if (this.checkValidity() === false) {
                // Prevent form submission and event propagation
                ev.preventDefault();
                ev.stopPropagation();
            }
            // When the form was validated
            $(this).addClass('was-validated');
        });

        // Reset form when the modal is being closed
        /*
        $('.modal').on('hide.bs.modal', function () {
            $(this).find('form').removeClass('was-validated');
            $(this).find('form')[0].reset();
        });*/
    }

    /**
     *  Validates a Multistep modal
     *
     * @param <String> modalName                Id or CSS class name of the modal element
     * @param <Collection> fieldsToValidate     Collection of input element with required attribute
     * @param <Number> nextStep                 Next step if fields are valid
     */
    function doMultiStepModalValidation(modalName, fieldsToValidate, nextStep) {
        var formValid = false;

        $.each(fieldsToValidate, function (index, input) {
            if ($(input)[0].validity.valid === false) {
                $(input).addClass('is-invalid');
                $(input).parent().addClass('is-invalid');
                formValid = $(input)[0].validity.valid;
                return false;
            } else {
                $(input).removeClass('is-invalid');
                $(input).parent().removeClass('is-invalid');
                formValid = $(input)[0].validity.valid;
                return true;
            }
        });

        // If modal form is valid trigger next step or close it
        if (formValid === true) {
            if (nextStep === -1) {
                $(modalName).modal('hide');
                var redirectLink = $(modalName).find('.btn-ditap-redirect').data('redirect');
                doRedirect(redirectLink);
            } else {
                $(modalName).trigger('next.m.' + nextStep);
            }
        }
    }

    function initInpageNav() {
        // Init inpage nav on diary detail page
        if ($('.content-wrapper').hasClass('diary-detail')) {
            var navItems = $('#inpage-nav-links').find('a'),
                inpageNavSelect = $('#inpage-nav-diary').find('.selectpicker');
            $.each(navItems, function (index, elem) {
                $(inpageNavSelect).append($('<option>', {
                    value: elem.hash,
                    text: ''
                }).data('content', $(elem).clone()[0].outerHTML));
            });
            $(inpageNavSelect).selectpicker('refresh');
        }
    }

    function doRedirect(redirectLink) {
        window.location.replace(redirectLink);
    }

    // @TODO export to separate file
    function initSlickSliders() {

        var contentWrapper = $('.content-wrapper');

        // Homepage product categories slider
        if (contentWrapper.hasClass('homepage')) {

            // Slick events
            $('.product-category-slider').slick({
                prevArrow: '<a href="#" class="nav-link icon-link slick-prev"><span class="icon-ditap-arrow arrow-left"></span></a>',
                nextArrow: '<a href="#" class="nav-link icon-link slick-next"><span class="icon-ditap-arrow arrow-right"></span></a>',
                variableWidth: true,
                mobileFirst: true,
                arrows: false,
                dots: false,
                responsive: [{

                    // No slick slider on small mobiles
                    breakpoint: 300,
                    variableWidh: false,
                    settings: "unslick" // destroys slick

                }, {

                    // Mobile viewport
                    breakpoint: 420,
                    settings: {
                        slidesToShow: 1,
                        dots: true,
                        arrows: false,
                        infinite: true
                    }

                }, {

                    // Tablet viewport
                    breakpoint: 767,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 1,
                        dots: true,
                        arrows: false,
                        infinite: false
                    }

                }, {

                    // Desktop viewport
                    breakpoint: 996,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 1,
                        arrows: true,
                        dots: false,
                        infinite: false
                    }
                }, {

                    // Large Desktop viewport
                    breakpoint: 1400,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 1,
                        arrows: true,
                        dots: false,
                        infinite: false
                    }
                }]
            });
        }

        // About page teaser slider
        if (contentWrapper.hasClass('about-me')) {

            // Init slick slider
            $('.teaser-slider-small-cards').slick({
                prevArrow: '<a href="#" class="nav-link icon-link slick-prev"><span class="icon-ditap-arrow arrow-left"></span></a>',
                nextArrow: '<a href="#" class="nav-link icon-link slick-next"><span class="icon-ditap-arrow arrow-right"></span></a>',
                variableWidth: true,
                mobileFirst: true,
                arrows: false,
                dots: false,
                responsive: [{
                    // No slick slider on small mobiles
                    breakpoint: 300,
                    variableWidh: false,
                    settings: "unslick" // destroys slick

                }, {

                    // Tablet viewport
                    breakpoint: 767,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 2,
                        dots: true,
                        arrows: false,
                        infinite: false
                    }

                }, {

                    // No slick slider on Desktop viewport
                    breakpoint: 996,
                    settings: "unslick" // destroys slick
                }]
            });
        }

        // Recipe page teaser slider
        if (contentWrapper.hasClass('recipe-class')) {

            // Init slick slider
            $('.teaser-slider-small-cards').slick({
                prevArrow: '<a href="#" class="nav-link icon-link slick-prev"><span class="icon-ditap-arrow arrow-left"></span></a>',
                nextArrow: '<a href="#" class="nav-link icon-link slick-next"><span class="icon-ditap-arrow arrow-right"></span></a>',
                variableWidth: true,
                mobileFirst: true,
                arrows: false,
                dots: false,
                responsive: [{
                    // Mobile viewport
                    breakpoint: 300,
                    settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1,
                        dots: true,
                        arrows: false,
                        infinite: false
                    }


                },
                    {
                        // Mobile viewport
                        breakpoint: 425,
                        settings: {
                            slidesToShow: 2,
                            slidesToScroll: 2,
                            dots: true,
                            arrows: false,
                            infinite: false
                        }
                    },
                    {

                        // Tablet viewport
                        breakpoint: 767,
                        settings: {
                            slidesToShow: 3,
                            slidesToScroll: 2,
                            dots: true,
                            arrows: false,
                            infinite: false
                        }

                    }, {

                        // No slick slider on Desktop viewport
                        breakpoint: 996,
                        settings: "unslick" // destroys slick
                    }]
            });
        }

        // Diary detail product teaser with variable cards
        if (contentWrapper.hasClass('diary-detail')) {

            // Slick Events
            $('.teaser-slider-variable-cards').on('beforeChange', function (event, slick, currentSlide, nextSlide) {
                $(this).addClass('sliding');
                $('.slick-arrow.slick-prev').addClass('visible');

                // Init slick slider
            }).slick({
                prevArrow: '<a href="#" class="nav-link icon-link slick-prev"><span class="icon-ditap-arrow arrow-left"></span></a>',
                nextArrow: '<a href="#" class="nav-link icon-link slick-next"><span class="icon-ditap-arrow arrow-right"></span></a>',
                variableWidth: true,
                mobileFirst: true,
                arrows: false,
                dots: false,
                responsive: [{

                    // Mobile viewport
                    breakpoint: 300,
                    settings: {
                        slidesToShow: 1,
                        dots: true,
                        arrows: false,
                        infinite: false,
                        centerMode: true
                    }
                }, {

                    // Tablet viewport
                    breakpoint: 767,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 2,
                        dots: true,
                        arrows: false,
                        infinite: false
                    }

                }, {

                    // Desktop viewport
                    breakpoint: 996,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 3,
                        dots: false,
                        arrows: true,
                        infinite: false
                    }

                }]
            });
        }

        // No search results page product teaser with variable cards and slider only on table viewport
        if (contentWrapper.hasClass('search-no-results')) {

            $('.teaser-slider-variable-cards-variant').slick({
                prevArrow: '<a href="#" class="nav-link icon-link slick-prev"><span class="icon-ditap-arrow arrow-left"></span></a>',
                nextArrow: '<a href="#" class="nav-link icon-link slick-next"><span class="icon-ditap-arrow arrow-right"></span></a>',
                variableWidth: true,
                mobileFirst: true,
                arrows: false,
                dots: false,
                responsive: [{
                    // No slick slider on small mobiles
                    breakpoint: 300,
                    variableWidh: false,
                    settings: "unslick" // destroys slick

                }, {

                    // Tablet viewport
                    breakpoint: 767,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 2,
                        dots: true,
                        arrows: false,
                        infinite: true
                    }

                }, {

                    // No slick slider on Desktop viewport
                    breakpoint: 996,
                    settings: "unslick" // destroys slick
                }]
            });
        }
    }
});