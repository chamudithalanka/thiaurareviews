document.addEventListener('DOMContentLoaded', function() {
    const stars = document.querySelectorAll('.star');
    const reviewForm = document.getElementById('reviewForm');
    let selectedRating = 0;
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    let currentUser = null;

    // Star rating functionality
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = this.dataset.rating;
            stars.forEach(s => {
                s.classList.remove('active', 'rate-1', 'rate-2', 'rate-3', 'rate-4', 'rate-5');
                if (s.dataset.rating <= selectedRating) {
                    s.classList.add('active', `rate-${selectedRating}`);
                }
            });
        });

        // Hover effects
        star.addEventListener('mouseover', function() {
            const hoverRating = this.dataset.rating;
            stars.forEach(s => {
                if (s.dataset.rating <= hoverRating) {
                    s.classList.add(`rate-${hoverRating}`);
                }
            });
        });

        star.addEventListener('mouseout', function() {
            stars.forEach(s => {
                s.classList.remove('rate-1', 'rate-2', 'rate-3', 'rate-4', 'rate-5');
                if (selectedRating && s.dataset.rating <= selectedRating) {
                    s.classList.add(`rate-${selectedRating}`);
                }
            });
        });
    });

    // Load existing reviews when page loads
    loadReviews();

    // Auth state observer
    window.firebaseAuth.onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            console.log('User is signed in:', user.email);
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
        } else {
            console.log('User is signed out');
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
        }
    });

    // Login button
    loginBtn.addEventListener('click', () => {
        console.log('Login button clicked');
        window.firebaseSignIn()
            .then((result) => {
                showNotification('Successfully signed in!');
            })
            .catch((error) => {
                showNotification(error.message, 'error');
            });
    });

    // Logout button
    logoutBtn.addEventListener('click', () => {
        console.log('Logout button clicked');
        window.firebaseSignOut()
            .then(() => {
                console.log('Successfully signed out');
            })
            .catch((error) => {
                console.error('Error signing out:', error);
                alert('Error signing out: ' + error.message);
            });
    });

    // Form submission
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Please sign in to post a review');
            return;
        }
        
        const name = document.getElementById('name').value;
        const comment = document.getElementById('comment').value;
        
        if (name && comment && selectedRating) {
            const review = {
                name: name,
                rating: selectedRating,
                comment: comment,
                date: new Date().toISOString(),
                userId: currentUser.uid,
                userEmail: currentUser.email
            };
            
            saveReview(review);

            // Reset form
            reviewForm.reset();
            stars.forEach(s => s.classList.remove('active', 'rate-1', 'rate-2', 'rate-3', 'rate-4', 'rate-5'));
            selectedRating = 0;
        }
    });

    function saveReview(review) {
        const reviewsRef = window.firebaseRef(window.firebaseDB, 'reviews');
        window.firebasePush(reviewsRef, review)
            .then(() => {
                console.log('Review saved successfully!');
            })
            .catch((error) => {
                console.error('Error saving review:', error);
            });
    }

    function addReviewToDOM(review, key) {
        const reviewsContainer = document.getElementById('reviewsContainer');
        const reviewCard = document.createElement('div');
        reviewCard.className = 'bg-white rounded-lg shadow-lg p-4 md:p-6 mb-4 md:mb-6 transform hover:scale-105 transition duration-300';
        reviewCard.setAttribute('data-aos', 'fade-up');
        
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5-review.rating);
        const date = new Date(review.date).toLocaleDateString();
        
        const actionButtons = currentUser && review.userId === currentUser.uid ? `
            <div class="flex flex-wrap gap-2 mt-4">
                <button onclick="editReview('${key}')" 
                    class="bg-green-500 text-white px-3 md:px-4 py-1 md:py-2 rounded-full hover:bg-green-600 transition duration-300 text-sm">
                    <i class="fas fa-edit mr-2"></i>Edit
                </button>
                <button onclick="deleteReview('${key}')" 
                    class="bg-red-500 text-white px-3 md:px-4 py-1 md:py-2 rounded-full hover:bg-red-600 transition duration-300 text-sm">
                    <i class="fas fa-trash-alt mr-2"></i>Delete
                </button>
            </div>
        ` : '';
        
        reviewCard.innerHTML = `
            <div class="flex items-center mb-4">
                <div class="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-lg md:text-xl font-bold">
                    ${review.name.charAt(0)}
                </div>
                <div class="ml-3 md:ml-4">
                    <h3 class="font-bold text-base md:text-lg">${review.name}</h3>
                    <div class="text-yellow-400 text-lg md:text-xl">${stars}</div>
                </div>
            </div>
            <p id="comment-${key}" class="text-gray-700 text-sm md:text-base mb-3 md:mb-4">${review.comment}</p>
            <small class="text-gray-500 text-xs md:text-sm"><i class="far fa-clock mr-2"></i>${date}</small>
            ${actionButtons}
        `;
        
        reviewsContainer.prepend(reviewCard);
    }

    // Add these functions globally
    window.editReview = function(key) {
        const newComment = prompt('Edit your review:');
        if (newComment !== null) {
            const reviewRef = window.firebaseRef(window.firebaseDB, `reviews/${key}`);
            window.firebaseUpdate(reviewRef, { comment: newComment })
                .then(() => {
                    document.getElementById(`comment-${key}`).textContent = newComment;
                })
                .catch((error) => console.error('Error updating review:', error));
        }
    };

    window.deleteReview = function(key) {
        if (confirm('Are you sure you want to delete this review?')) {
            const reviewRef = window.firebaseRef(window.firebaseDB, `reviews/${key}`);
            window.firebaseRemove(reviewRef)
                .then(() => {
                    location.reload(); // Refresh to show updated reviews
                })
                .catch((error) => console.error('Error deleting review:', error));
        }
    };

    function loadReviews() {
        const reviewsContainer = document.getElementById('reviewsContainer');
        const reviewsRef = window.firebaseRef(window.firebaseDB, 'reviews');
        
        reviewsContainer.innerHTML = '';
        
        window.firebaseOnChildAdded(reviewsRef, (snapshot) => {
            const review = snapshot.val();
            addReviewToDOM(review, snapshot.key);
        });
    }

    function showNotification(message, type = 'success') {
        Toastify({
            text: message,
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: type === 'success' ? "#48BB78" : "#F56565",
            stopOnFocus: true,
        }).showToast();
    }

    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true
    });
}); 