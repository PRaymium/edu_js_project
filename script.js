let films = [];
let genres = [];
let filteredItems = [];

const MAX_SEARCH_WORD_LENGHT = 2;
const SEARCH_PAUSE = 700;
const MAX_DISPLAYED_ITEMS_SIZE = 6;

let currentTypeOfSortItemsList = 1;
let currentFilterId = 0;

let searchTimeout;
let searchText = '';

let displayedItems = 0;

const loadGenres = async () => {
    await axios.get('./assets/data/genres.json')
    .then(response => {
        response.data.sort((a, b) => {
            if (a.name > b.name) return 1;
            else if (a.name < b.name) return -1;
            return 0;
        });
        genres = [ ...response.data ];
    })
    .catch(err => console.error(err));
}

const loadFilms = async () => {
    await axios.get('./assets/data/films.json')
    .then(response => {
        films = [ ...response.data ];
    })
    .catch(err => console.error(err));
}

const filterHandler = event => {
    console.log('filter:', event.target.value);
    currentFilterId = +event.target.value;
    displayedItems = 0;
    createItemsList();
};

const filterItem = (item, checked = false) => {
    //создаем новый элемент списка фильтра
    const el = document.createElement('li');
    el.classList.add('filter__item');

    //добавляем в него переключатель и подпись
    el.insertAdjacentHTML('beforeend', `
        <input type="radio" class="form-check-input" name="filter-item" id="filter-item-${item.id}" value="${item.id}">
        <label for="filter-item-${item.id}">${item.name}</label>
    `);

    el.firstElementChild.checked = checked;
    el.firstElementChild.addEventListener('click', filterHandler);

    return el;
}

const searchHandler = event => {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
        searchText = event.target.value;
        displayedItems = 0;
        createItemsList();
    }, SEARCH_PAUSE);
}

const getSearchingWords = () => {
    return searchText.trim().split(' ').reduce((acc, word) => {
        if (word && word.length >= MAX_SEARCH_WORD_LENGHT) {
            acc.push(new RegExp(`(\\s|^)${word}`, 'gi'));
        }
        return acc;
    }, []);
}

const findItems = (items, words) => {
    return items.filter(item => {
        const name = item.name.replace(/["«»]/g, '');
        return words.some(word => name.match(word));
    });
};

const searching = items => {
    const words = getSearchingWords();

    if (words.length) {
        return findItems(items, words);
    }

    return items;
}

const createFilter = () => {
    const filter = document.getElementById('filter-list');

    // добавляем строчку для выбора всех жанров
    const itemAll = { id: 0, name: 'Все' };
    filter.appendChild(filterItem(itemAll, true));

    //добавляем остальные элементы списка фильтров
    for (let item of genres) {
        filter.appendChild(filterItem(item));
    }
};

const sortHandler = btn => {
    const oldBtn = document.querySelector('.dropdown-item.active');
    oldBtn.classList.remove("active");

    const toggle = document.getElementById('dropdownMenu-items-view-sort');
    toggle.textContent = btn.textContent;
    btn.classList.add('active');

    currentTypeOfSortItemsList = +btn.dataset.id;
    console.log('sortType:', currentTypeOfSortItemsList);
    displayedItems = 0;
    createItemsList();
}

const itemsListSorting = items => {
    //сортируем поступивший массив фильмов в соответствии с выбранным типом сортировки
    let list = [ ...items ];
    switch (+currentTypeOfSortItemsList) {
        case 1:
            list.sort((a, b) => {
                if (a.name > b.name) return 1;
                else if (a.name < b.name) return -1;
                return 0;
            });
            break;
        case 2:
            list.sort((a, b) => a.rating - b.rating);
            break;
        case 3:
            list.sort((a, b) => b.rating - a.rating);
            break;
        case 4:
            list.sort((a, b) => a.duration - b.duration)
            break;
        case 5:
            list.sort((a, b) => b.duration - a.duration);
            break;
        default:
            break;
    }

//    list = items.sort((a, b) => {
//         const aName = a.name.replace(/["«»]/g, '');
//         const bName = b.name.replace(/["«»]/g, '');
        
//         if (aName < bName) return -1;
//         if (aName > bName) return 1;
//         return 0;
//     });

    // if (currentTypeOfSortItemsList > 1) {
    //     list = list.sort((a, b) => {
    //         return +b[currentTypeOfSortItemsList] - +a[currentTypeOfSortItemsList];
    //     });
    // }

    return list;
}

const listItem = item => {
    //создаем новый элемент списка фильмов
    const el = document.createElement('div');
    el.classList.add('col-xl-4', 'col-md-6', 'col-sm-12');

    //указываем постер, название, рейтинг, возрастной рейтинг и продолжительность фильма
    el.insertAdjacentHTML('beforeend', `
    <div class="items-list__item" title="${item.name}">
        <img class="items-list__item-img" src="assets/img/${item.img}" alt="">
        <div class="items-list__item-age-rating">${item.age}</div>
        <span class="items-list__item-name">${item.name}</span>
        <div class="items-list__item-props">
            <div class="items-list__item-prop">
                <div class="items-list__item-prop-rating-img text-primary">★</div>
                <div class="items-list__item-prop-rating-value">${item.rating}</div>
            </div>
            <div class="items-list__item-prop">
                <div class="items-list__item-prop-duration-img text-primary">⧗</div>
                <div class="items-list__item-prop-duration-value">${item.duration} мин.</div>
            </div>
        </div>
    </div>
    `);

    return el;
}

const nextPageHandler = () => {
    const itemsPage = prepareItemsPage(filteredItems);
    buildItemsPage(itemsPage);
}

const prepareItemsList = () => {
    let list = [ ...films ];
    const itemsList = document.getElementById('items-list');
    itemsList.innerHTML = "";

    //фильтруем список фильмов
    if (currentFilterId > 0) {
        list = films.filter(card => card.genres.includes(currentFilterId));
    }

    //осуществляем поиск
    list = searching(list);

    //сортируем список фильмов
    list = itemsListSorting(list);
    return list;
}

const prepareItemsPage = items => {
    let list;

    // пагинация
    const start = displayedItems;
    displayedItems += MAX_DISPLAYED_ITEMS_SIZE;
    list = items.slice(start, displayedItems);

    return list;
}

const buildItemsPage = itemsPage => {
    const itemsList = document.getElementById('items-list');

    for (let item of itemsPage) {
        itemsList.appendChild(listItem(item));
    }

    // информация о кол-ве
    const show = displayedItems >= filteredItems.length ? filteredItems.length : displayedItems;
    const counterOfDisplayedFilms = document.getElementById('countOfDisplayItem');
    counterOfDisplayedFilms.textContent = `Показано ${show} из ${filteredItems.length} фильмов`;

    const btnLoadMore = document.getElementById('btn-loadMore');
    btnLoadMore.style.display = displayedItems >= filteredItems.length ? 'none' : 'block';
}

const createItemsList = () => {
    filteredItems = prepareItemsList();
    const itemsPage = prepareItemsPage(filteredItems);
    buildItemsPage(itemsPage);
}

const create = async () => {
    const search = document.getElementById('search');
    search.addEventListener('input', searchHandler);

    await loadGenres();
    await loadFilms();

    createFilter();
    createItemsList();
}

create();