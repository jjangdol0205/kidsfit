function filterCat(cat, btn) {
      document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      document.querySelectorAll('.hub-card').forEach(function(card){
        card.style.display = (cat === 'all' || card.getAttribute('data-cat') === cat) ? 'block' : 'none';
      });
    }
    (function(){
      var params = new URLSearchParams(window.location.search);
      var cat = params.get('cat');
      if (cat === 'growth' || cat === 'learning') {
        var btns = document.querySelectorAll('.filter-btn');
        filterCat(cat, cat === 'growth' ? btns[1] : btns[2]);
      }
    })();
