console.log("hello world");

const form = document.querySelector('form');
const errorElement = document.querySelector('.error-message');
const loadingThing = document.querySelector('.loading');
const messageElement = document.querySelector('.messages');
const loadMoreElement = document.querySelector('#loadMore');
const API_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') ? 'http://localhost:5000/v2/messages' : '';

let skip = 0;
let limit = 5;
let loading = false;
let finished = false;

errorElement.style.display = 'none';

document.addEventListener('scroll', () => {
    const rect = loadMoreElement.getBoundingClientRect();
    if (rect.top < window.innerHeight && !loading && !finished) {
      loadMore();
    }
});

listAllMessages();

loadingThing.style.display = 'none';

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = formData.get('name');
    const content = formData.get('content');

    if (name.trim() && content.trim()) {
        errorElement.style.display = 'none';
        form.style.display = 'none';
        loadingThing.style.display = '';
    
        const messageThing = {
          name,
          content
        };
        
        fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify(messageThing),
          headers: {
            'content-type': 'application/json'
          }
        }).then(response => {      
          if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType.includes('json')) {
              return response.json().then(error => Promise.reject(error.message));
            } else {
              return response.text().then(message => Promise.reject(message));
            }
          }
        }).then(() => {
          form.reset();
          setTimeout(() => {
            form.style.display = '';
          }, 30000);
          listAllMews();
        }).catch(errorMessage => {
          form.style.display = '';
          errorElement.textContent = errorMessage;
          errorElement.style.display = '';
          loadingThing.style.display = 'none';
        });
      } else {
        errorElement.textContent = 'Name and content are required!';
        errorElement.style.display = '';
      }
});

function loadMore() {
    skip += limit;
    listAllMessages(false);
}

function listAllMessages(reset = true) {
    loading = true;
    if (reset) {
      messageElement.innerHTML = '';
      skip = 0;
      finished = false;
    }
    fetch(`${API_URL}?skip=${skip}&limit=${limit}`)
      .then(response => response.json())
      .then(result => {
        result.messages.forEach(mew => {
          const div = document.createElement('div');
  
          const header = document.createElement('h3');
          header.textContent = mew.name;
  
          const contents = document.createElement('p');
          contents.textContent = mew.content;
  
          const date = document.createElement('small');
          date.textContent = new Date(mew.created);
  
          div.appendChild(header);
          div.appendChild(contents);
          div.appendChild(date);
  
          mewsElement.appendChild(div);
        });
        loadingThing.style.display = 'none';
        if (!result.meta.has_more) {
          loadMoreElement.style.visibility = 'hidden';
          finished = true;
        } else {
          loadMoreElement.style.visibility = 'visible';
        }
        loading = false;
      });
  }