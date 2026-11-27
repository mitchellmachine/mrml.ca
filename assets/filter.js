const filter = document.querySelector('#filter');
const status = document.querySelector('#filter-status');
const topics = [...document.querySelectorAll('#directory > section')];

function update() {
  const terms = filter.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let total = 0;
  for (const topic of topics) {
    let count = 0;
    for (const entry of topic.querySelectorAll('li')) {
      const text = (topic.querySelector('h3').textContent + ' ' + entry.textContent).toLowerCase();
      entry.hidden = !terms.every(term => text.includes(term));
      if (!entry.hidden) count++;
    }
    const topicLink = document.querySelector('.topic-links a[href="#' + topic.id + '"]');
    topic.hidden = count === 0;
    topicLink.hidden = topic.hidden;
    total += count;
  }
  status.textContent = total ? total + (total === 1 ? ' document' : ' documents') : 'No documents match your filter.';
}

document.querySelector('#filter-panel').hidden = false;
filter.addEventListener('input', update);
update();
