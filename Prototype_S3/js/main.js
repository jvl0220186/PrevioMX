$(document).ready(function () {

    // ---- Navbar scroll effect ----
    $(window).on('scroll', function () {
        $('.glass-nav').toggleClass('scrolled', $(this).scrollTop() > 50);
    });

    // ---- Animated counter (hero stats) ----
    function animateCounters() {
        $('[data-count]').each(function () {
            var $el = $(this);
            if ($el.data('counted')) return;

            var target = parseInt($el.data('count'), 10);
            var duration = 1500;
            var start = 0;
            var startTime = null;

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                var progress = Math.min((timestamp - startTime) / duration, 1);
                var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
                $el.text(Math.floor(eased * target));
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    $el.text(target);
                }
            }

            $el.data('counted', true);
            requestAnimationFrame(step);
        });
    }

    // ---- Intersection Observer for fade-in + counters ----
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    $(entry.target).addClass('visible');
                    if ($(entry.target).find('[data-count]').length) {
                        animateCounters();
                    }
                }
            });
        }, { threshold: 0.15 });

        $('.fade-in, .hero-stats').each(function () {
            observer.observe(this);
        });

        // Auto-trigger hero counters on load
        setTimeout(animateCounters, 800);
    } else {
        $('.fade-in').addClass('visible');
        animateCounters();
    }

    // ---- Subtle tilt on prototype cards (desktop only) ----
    if (window.matchMedia('(hover: hover)').matches) {
        $('[data-tilt]').on('mousemove', function (e) {
            var rect = this.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var centerX = rect.width / 2;
            var centerY = rect.height / 2;
            var rotateX = ((y - centerY) / centerY) * -4;
            var rotateY = ((x - centerX) / centerX) * 4;

            $(this).css('transform',
                'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-6px)'
            );
        }).on('mouseleave', function () {
            $(this).css('transform', '');
        });
    }

    // ---- Smooth scroll for anchor links ----
    $('a[href^="#"]').on('click', function (e) {
        var target = $($(this).attr('href'));
        if (target.length) {
            e.preventDefault();
            $('html, body').animate({ scrollTop: target.offset().top - 80 }, 600);
        }
    });

    // ---- Close mobile nav on link click ----
    $('.navbar-nav .nav-link').on('click', function () {
        var collapse = $('#mainNav');
        if (collapse.hasClass('show')) {
            bootstrap.Collapse.getInstance(collapse[0]).hide();
        }
    });

    // ---- Mobile tab bar interaction ----
    $(document).on('click', '.mobile-tab-item', function () {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
    });

    // ---- Utility: Generate random chart bars ----
    window.PrevioMX = window.PrevioMX || {};

    PrevioMX.generateChartBars = function (container, count) {
        var $container = $(container);
        $container.empty();
        for (var i = 0; i < (count || 12); i++) {
            var height = Math.floor(Math.random() * 70) + 25;
            $('<div class="chart-bar"></div>')
                .css('height', height + '%')
                .appendTo($container);
        }
    };

    // Auto-generate chart bars if placeholder exists
    $('.chart-placeholder').each(function () {
        PrevioMX.generateChartBars(this, 12);
    });

    // ---- Toast helper ----
    PrevioMX.showToast = function (message, type) {
        type = type || 'success';
        var iconMap = {
            success: 'bi-check-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            danger: 'bi-x-circle-fill',
            info: 'bi-info-circle-fill'
        };
        var colorMap = {
            success: 'var(--accent-2)',
            warning: 'var(--accent-4)',
            danger: 'var(--accent-3)',
            info: 'var(--accent-1)'
        };

        var $toast = $('<div class="alert-glass position-fixed" style="z-index:9999;top:90px;right:20px;max-width:360px;animation:slideInRight .4s ease"></div>')
            .css('border-left', '3px solid ' + colorMap[type])
            .html('<i class="bi ' + iconMap[type] + ' me-2" style="color:' + colorMap[type] + '"></i>' + message)
            .appendTo('body');

        setTimeout(function () {
            $toast.fadeOut(300, function () { $(this).remove(); });
        }, 3500);
    };

    console.log('%c PrevioMX Prototipos cargado ', 'background: linear-gradient(135deg, #6c5ce7, #00cec9); color: white; padding: 8px 16px; border-radius: 8px; font-weight: bold;');
});
