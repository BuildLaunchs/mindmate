document.addEventListener('DOMContentLoaded', () => {
    // Sample data for community posts
    let communityPosts = [
        { 
            id: 1, 
            author: "BraveSoul21", 
            avatarColor: "bg-primary", 
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            title: "Finally spoke to a therapist, and it wasn't scary!", 
            content: "I've been putting off therapy for years out of fear. I finally had my first session yesterday. It was just a conversation, and I felt so much lighter afterward. If you're on the fence, I encourage you to take that first step.",
            tags: ["therapy", "hope", "first-step"],
            likes: 42, 
            comments: 8 
        },
        { 
            id: 2, 
            author: "QuietObserver", 
            avatarColor: "bg-accent", 
            timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // 22 hours ago
            title: "How do you deal with social anxiety at work?", 
            content: "I started a new job and my social anxiety is through the roof. Every meeting feels like a performance, and I'm constantly worried about saying the wrong thing. Does anyone have any coping strategies that have worked for them?",
            tags: ["anxiety", "workplace", "advice-needed"],
            likes: 18, 
            comments: 15 
        },
        { 
            id: 3, 
            author: "SunnySideUp", 
            avatarColor: "bg-warning", 
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            title: "A small win: I went for a walk today.", 
            content: "Depression has made it hard to even get out of bed. Today, I managed to go for a 15-minute walk, and I saw a really cute dog. It's a small thing, but it feels like a huge victory. Celebrating the small wins helps.",
            tags: ["depression", "small-wins", "hope"],
            likes: 78, 
            comments: 12 
        },
        {
            id: 4,
            author: "MindfulMe",
            avatarColor: "bg-wellness",
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            title: "Meditation has changed my life",
            content: "I started meditating 6 months ago and the difference is incredible. My anxiety levels have dropped and I feel more present in my daily life. If you're struggling, give it a try!",
            tags: ["meditation", "anxiety", "wellness"],
            likes: 55,
            comments: 5
        },
        {
            id: 5,
            author: "MindfulMe",
            avatarColor: "bg-wellness",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            title: "Overcoming Panic Attacks",
            content: "Panic attacks used to control my life. Through therapy and breathing exercises, I've learned to manage them. It’s a journey, but I’m hopeful for the future.",
            tags: ["panic-attacks", "therapy", "hope"],
            likes: 63,
            comments: 9

        },
        {
            id: 6,
            author: "MindfulMe",
            avatarColor: "bg-wellness",
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
            title: "Journaling for Mental Clarity",
            content: "Journaling has been a game-changer for my mental health. It helps me process my thoughts and emotions. I recommend setting aside just 10 minutes a day to write down how you're feeling.",
            tags: ["journaling", "mental-health", "clarity"],
            likes: 47,
            comments: 4 
        }
    ];

    const grid = document.getElementById('community-posts-grid');
    const filtersContainer = document.getElementById('post-filters');
    const createPostForm = document.getElementById('create-post-form');

    function renderPosts(filter = 'latest') {
        if (!grid) return;
        grid.innerHTML = '';
        
        let sortedPosts = [...communityPosts];
        if (filter === 'latest') {
            sortedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } else if (filter === 'popular') {
            sortedPosts.sort((a, b) => b.likes - a.likes);
        } else if (filter === 'hope') {
            sortedPosts = sortedPosts.filter(p => p.tags.includes('hope')).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        if (sortedPosts.length === 0) {
            grid.innerHTML = `<p class="lg:col-span-2 text-center text-muted-foreground py-8">No stories found for this category yet. Be the first to share!</p>`;
            return;
        }
        
        sortedPosts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'wellness-card post-card flex flex-col';
            card.innerHTML = `
                <div class="card-content flex-1">
                    <div class="flex items-start gap-4 mb-4">
                        <div class="post-author-avatar ${post.avatarColor}">
                            ${post.author.substring(0, 2)}
                        </div>
                        <div class="flex-1">
                            <h3 class="card-title text-lg leading-tight">${post.title}</h3>
                            <p class="text-sm text-muted-foreground">by ${post.author} &bull; ${getTimeAgo(post.timestamp)}</p>
                        </div>
                    </div>
                    <p class="card-description mb-4">${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
                </div>
                <div class="card-footer p-4 border-t flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="post-meta-item"><i data-lucide="heart" class="w-4 h-4"></i> ${post.likes}</span>
                        <span class="post-meta-item"><i data-lucide="message-square" class="w-4 h-4"></i> ${post.comments}</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        lucide.createIcons();
    }

    filtersContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            document.querySelectorAll('#post-filters .filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderPosts(e.target.dataset.filter);
        }
    });

    createPostForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        const tags = document.getElementById('post-tags').value.split(',').map(tag => tag.trim()).filter(Boolean);

        const newPost = {
            id: Date.now(),
            author: "NewVoice" + Math.floor(Math.random() * 100),
            avatarColor: "bg-wellness",
            timestamp: new Date().toISOString(),
            title,
            content,
            tags,
            likes: 0,
            comments: 0
        };

        communityPosts.unshift(newPost);
        renderPosts();
        createPostForm.reset();
        closeModal('create-post-modal');
        showToast('Your story has been shared successfully!', 'success');
    });

    // Initial render
    renderPosts();
});