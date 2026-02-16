document.addEventListener('DOMContentLoaded', () => {
  const resourcesData = [
    
  {
    title: "5 min for anxiety",
    description: "Grounding technique using your five senses.",
    type: "Guided Exercise",
    duration: "03:52",
    category: "Mental Health",
    youtubeUrl: "https://www.youtube.com/watch?v=30VMIEmA114"
  },
  {
    title: "5 min for stress",
    description: "Box breathing technique for instant calm.",
    type: "Guided Exercise",
    duration: "01:56",
    category: "Mental Health",
    youtubeUrl: "https://www.youtube.com/watch?v=8TTABLdGCKI"
  },
  {
    title: "Exam stress",
    description: "Balance fight-or-flight with relaxation.",
    type: "Science/Educational",
    duration: "03:33",
    category: "Academic Wellness",
    youtubeUrl: "https://www.youtube.com/watch?v=-RZ86OB9hw4"
  },
  {
    title: "Academic stress",
    description: "Use time-blocking and organization skills.",
    type: "Guide/Strategy",
    duration: "06:17",
    category: "Academic Wellness",
    youtubeUrl: "https://www.youtube.com/watch?v=Bk2-dKH2Ta4"
  },
  {
    title: "Solution to academic stress",
    description: "Daily habits like posture and hugging.",
    type: "Advice/Animation",
    duration: "05:57",
    category: "Self-Care",
    youtubeUrl: "https://www.youtube.com/watch?v=o18I23HCQtE"
  },
  {
    title: "Sleep fixing",
    description: "Vitamin D deficiency might ruin sleep.",
    type: "Health Education",
    duration: "10:44",
    category: "Physical Health",
    youtubeUrl: "https://www.youtube.com/watch?v=pf_z1OSYxmk"
  },
  {
    title: "Sleep routine fix",
    description: "Wake up consistently and get sunlight.",
    type: "Guide/Routine",
    duration: "07:38",
    category: "Physical Health",
    youtubeUrl: "https://www.youtube.com/watch?v=4WASgOyGjjQ"
  },
  {
    title: "White noise for sleep / meditate",
    description: "Ten hours of noise blocks distractions.",
    type: "Ambience",
    duration: "10:00:00",
    category: "Sleep Aid",
    youtubeUrl: "https://www.youtube.com/watch?v=5dden6Vqj4A"
  },
  {
    title: "What is social anxiety?",
    description: "Fear of rejection versus connecting desires.",
    type: "Educational",
    duration: "07:51",
    category: "Mental Health",
    youtubeUrl: "https://www.youtube.com/watch?v=VdoSgPRe_gw"
  },
  {
    title: "How to stop ruminating",
    description: "Fix underlying emotions, not just thoughts.",
    type: "Therapy/Guide",
    duration: "13:41",
    category: "Mental Health",
    youtubeUrl: "https://www.youtube.com/watch?v=UOpX18ey8WQ"
  },
  {
    title: "You Matter",
    description: "Motivational speech: you have a purpose.",
    type: "Motivational Speech",
    duration: "04:51",
    category: "Motivation",
    youtubeUrl: "https://www.youtube.com/watch?v=EQo4rSQkT6U"
  },
  {
    title: "6 lvls of thinking for students",
    description: "Deeply understand concepts, don't just memorize.",
    type: "Study Technique",
    duration: "13:16",
    category: "Study Skills",
    youtubeUrl: "https://www.youtube.com/watch?v=1xqerXscTsE"
  },
  {
    title: "Before Exam video",
    description: "Use active recall, do not cram.",
    type: "Guide/Vlog",
    duration: "11:47",
    category: "Study Skills",
    youtubeUrl: "https://www.youtube.com/watch?v=5wT0Py4yfkk"
  },
  {
    title: "Are you avoiding study?",
    description: "Pretend you're being filmed to focus.",
    type: "Psychology/Guide",
    duration: "09:55",
    category: "Productivity",
    youtubeUrl: "https://www.youtube.com/watch?v=z0AqPPN6lxA"
  },
  {
    title: "Be Disciplined",
    description: "Consistent discipline beats natural talent always.",
    type: "Motivational",
    duration: "08:09",
    category: "Motivation",
    youtubeUrl: "https://www.youtube.com/watch?v=js1gEHYOQyE"
  },
  {
    title: "Getting straight ‘A’",
    description: "Study faster with gamification and focus.",
    type: "Strategy",
    duration: "10:24",
    category: "Study Skills",
    youtubeUrl: "https://www.youtube.com/watch?v=YW2-BxslOZE"
  },
  {
    title: "The dopamine game",
    description: "Avoid morning phone use to focus.",
    type: "Routine/Guide",
    duration: "11:32",
    category: "Productivity",
    youtubeUrl: "https://www.youtube.com/watch?v=IAb2QHdNe1A"
  }

    
    
  ];

  const grid = document.getElementById('resource-grid');
  const filtersContainer = document.getElementById('resource-filters');
  const searchInput = document.getElementById('resource-search');
  const totalChip = document.getElementById('total-resources-chip');
  const activeFilterLabel = document.getElementById('active-filter-label');

  let activeFilter = 'all';
  let searchQuery = '';

  // Helper to get category badges
  function getCategoryStyle(category) {
    switch (category) {
      case 'Beginner':
        return 'bg-wellness/20 text-wellness';
      case 'Intermediate':
        return 'bg-warning/20 text-warning';
      case 'Advanced':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  function applyFilters() {
    let list = [...resourcesData];

    // type filter
    if (activeFilter !== 'all') {
      list = list.filter(r => r.type === activeFilter);
    }

    // search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        r =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }

    return list;
  }

  function renderCounters() {
    const allCount = resourcesData.length;
    const types = ['exercise', 'article', 'audio', 'video'];

    const allBadge = document.querySelector('[data-count-badge="all"]');
    if (allBadge) allBadge.textContent = allCount;

    types.forEach(t => {
      const count = resourcesData.filter(r => r.type === t).length;
      const badge = document.querySelector(`[data-count-badge="${t}"]`);
      if (badge) badge.textContent = count;
    });

    if (totalChip) {
      totalChip.textContent =
        allCount === 1 ? '1 resource available' : `${allCount} resources available`;
    }
  }

  function renderResources() {
    const filteredResources = applyFilters();
    grid.innerHTML = '';

    if (activeFilterLabel) {
      const filterName =
        activeFilter === 'all'
          ? 'All'
          : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);
      const extra = searchQuery ? ` • Search: "${searchQuery}"` : '';
      activeFilterLabel.textContent = `Showing: ${filterName}${extra}`;
    }

    if (filteredResources.length === 0) {
      grid.innerHTML = `
        <div class="lg:col-span-3 flex flex-col items-center justify-center text-center gap-3 bg-card border rounded-2xl p-8">
          <i data-lucide="search-x" class="w-8 h-8 text-muted-foreground"></i>
          <p class="text-md font-medium">No resources match your filters.</p>
          <p class="text-sm text-muted-foreground">
            Try clearing the search or switching to a different category.
          </p>
          <button id="clear-filters-btn" class="btn btn-outline btn-sm mt-2">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            Reset filters
          </button>
        </div>
      `;
      lucide.createIcons();

      const resetBtn = document.getElementById('clear-filters-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          searchQuery = '';
          if (searchInput) searchInput.value = '';
          activeFilter = 'all';
          document
            .querySelectorAll('.filter-btn')
            .forEach(btn => btn.classList.remove('active'));
          const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
          if (allBtn) allBtn.classList.add('active');
          renderResources();
        });
      }

      return;
    }

    filteredResources.forEach(resource => {
      const card = document.createElement('div');
      card.className = 'wellness-card resource-card p-0';

      card.innerHTML = `
        <div class="card-content p-6">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 class="card-title text-lg mb-1">${resource.title}</h3>
              <p class="text-xs text-muted-foreground capitalize">
                ${resource.type}
              </p>
            </div>
            <div class="p-2 rounded-full bg-primary/20 text-primary">
              <i data-lucide="${resource.icon}" class="w-5 h-5"></i>
            </div>
          </div>
          <p class="card-description mb-4">${resource.description}</p>
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="resource-tag ${getCategoryStyle(
                resource.category
              )}">${resource.category}</span>
              <span class="text-xs text-muted-foreground">${resource.duration}</span>
            </div>
            <span class="text-xs text-muted-foreground">
              <i data-lucide="clock" class="w-3 h-3 inline-block mr-1"></i>
              Fits in your day
            </span>
          </div>
        </div>
       <div class="card-footer p-4 border-t">
          <a 
            href="${resource.youtubeUrl}"
            target="_blank"
            class="btn btn-wellness w-full"
            style="text-decoration: none;"
          >
            <i data-lucide="play-circle" class="w-4 h-4"></i>
            Watch on YouTube
          </a>
        </div>
      `;

      grid.appendChild(card);
    });

    lucide.createIcons();
  }

  // Filter click handling
  if (filtersContainer) {
    filtersContainer.addEventListener('click', e => {
      const target = e.target.closest('button');
      if (!target) return;
      const filter = target.dataset.filter;
      if (!filter) return;

      activeFilter = filter;
      document
        .querySelectorAll('.filter-btn')
        .forEach(btn => btn.classList.remove('active'));
      target.classList.add('active');

      renderResources();
    });
  }

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value || '';
      renderResources();
    });
  }

  // Initial render
  renderCounters();
  renderResources();
});
