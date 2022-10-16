inpx-web
========

Веб-сервер для поиска по .inpx-коллекции.
Выглядит это так: https://lib.omnireader.ru

.inpx - индексный файл для импорта\экспорта информации из базы данных сетевых библиотек
в базу каталогизатора [MyHomeLib](https://alex80.github.io/mhl/)
или [freeLib](http://sourceforge.net/projects/freelibdesign)
или [LightLib](https://lightlib.azurewebsites.net)

Просто поместите приложение `inpx-web` в папку с .inpx-файлом и файлами библиотеки (zip-архивами) и запустите.
Сервер будет доступен по адресу http://127.0.0.1:12380

После открытия веб-приложения в бразуере, для быстрого понимания того, как работает поиск, воспользуйтесь памяткой (кнопка со знаком вопроса).

##
* [Возможности программы](#capabilities)
* [Использование](#usage)
    * [Параметры командной строки](#cli)
    * [Конфигурация](#config)
    * [Удаленная библиотека](#remotelib)
    * [Фильтр по аторам и книгам](#filter)
    * [Настройка https с помощью nginx](#https)
* [Сборка проекта](#build)
* [Разработка](#development)

<a id="capabilities" />

## Возможности программы
- поиск по автору, серии, названию и пр.
- скачивание книги, копирование ссылки или открытие в читалке
- возможность указать рабочий каталог при запуске, а также расположение .inpx и файлов библиотеки
- ограничение доступа по паролю
- работа в режиме "удаленная библиотека"
- фильтр авторов и книг при создании поисковой БД для создания своей коллекции "на лету"
- подхват изменений .inpx-файла (периодическая проверка), автоматическое пересоздание поисковой БД
- мощная оптимизация, хорошая скорость поиска
- релизы под Linux и Windows

<a id="usage" />

## Использование
Поместите приложение `inpx-web` в папку с .inpx-файлом и файлами библиотеки и запустите.
По умолчанию сервер будет доступен по адресу http://127.0.0.1:12380

<a id="cli" />

### Параметры командной строки
Запустите `inpx-web --help`, чтобы увидеть список опций:
```console
Usage: inpx-web [options]

Options:
  --help              Показать опции командной строки
  --host=<ip>         Задать имя хоста для веб сервера, по умолчанию: 0.0.0.0
  --port=<port>       Задать порт для веб сервера, по умолчанию: 12380
  --app-dir=<dirpath> Задать рабочую директорию, по умолчанию: <execDir>/.inpx-web
  --lib-dir=<dirpath> Задать директорию библиотеки (с zip-архивами), по умолчанию: там же, где лежит файл приложения
  --inpx=<filepath>   Задать путь к файлу .inpx, по умолчанию: тот, что найдется в директории библиотеки
  --recreate          Принудительно пересоздать поисковую БД при запуске приложения
```

<a id="config" />

### Конфигурация
При первом запуске в рабочей директории будет создан конфигурационный файл `config.json`:
```js
{
    // пароль для ограничения доступа к веб-интерфейсу сервера
    "accessPassword": "",

    // содержимое кнопки-ссылки (читать), если не задано - кнопка (читать) не показывается
    // пример: "https://omnireader.ru/#/reader?url=${DOWNLOAD_LINK}"
    // на место ${DOWNLOAD_LINK} будет подставлена ссылка на скачивание файла книги
    "bookReadLink": "",

    // включить(true)/выключить(false) журналирование
    "loggingEnabled": true,

    // максимальный размер в байтах директории закешированных файлов в <раб.дир>/public/files
    // чистка каждый час
    "maxFilesDirSize": 1073741824,
    
    // включить(true)/выключить(false) кеширование запросов на сервере
    "queryCacheEnabled": true,

    // периодичность чистки кеша запросов на сервере, в минутах
    // 0 - отключить чистку
    "cacheCleanInterval": 60,

    // периодичность проверки изменений .inpx-файла, в минутах
    // если файл изменился, поисковая БД будет автоматически пересоздана
    // 0 - отключить проверку
    "inpxCheckInterval": 60,

    // включить(true)/выключить(false) режим работы с малым количеством физической памяти на машине
    // при включении этого режима, количество требуемой для создания БД памяти снижается примерно в 1.5-2 раза
    // во столько же раз увеличивается время создания
    "lowMemoryMode": false,

    // включить(true)/выключить(false) режим "Удаленная библиотека" (сервер)
    "allowRemoteLib": false,

    // включить(Object)/выключить(false) режим "Удаленная библиотека" (клиент)
    // подробнее см. раздел "Удаленная библиотека" ниже
    "remoteLib": false,

    // настройки веб-сервера
    "server": {
        "host": "0.0.0.0",
        "port": "12380"
    }
}
```

При необходимости, можно настроить нужный параметр в этом файле вручную. Параметры командной
строки имеют больший приоритет, чем настройки из `config.json`.

<a id="remotelib" />

### Удаленная библиотека

В случае, когда необходимо физически разнести веб-интерфейс и библиотеку файлов на разные машины,
приложение может работать в режиме клиент-сервер: веб-интерфейс, поисковый движок и поисковая БД на одной машине (клиент),
а библиотека книг и .inpx-файл на другой (сервер).

Для этого необходимо развернуть два приложения, первое из которых будет клиентом для второго.

На сервере правим `config.json`:
```
    "accessPassword": "123456",
    "allowRemoteLib": true,
```

На клиенте:
```
    "remoteLib": {
    	"accessPassword": "123456",
        "url": "ws://server.host:12380"
    },
```

Если сервер работает по протоколу `http://`, то указываем протокол `ws://`, а для `https://` соответственно `wss://`.
Пароль не обязателен, но необходим в случае, если сервер тоже "смотрит" в интернет, для ограничения доступа к его веб-интерфесу.
При указании `"remoteLib": {...}` настройки командной строки --inpx и --lib-dir игнорируются,
т.к. файлы .inpx-индекса и библиотеки используются удаленно.

<a id="filter" />

### Фильтр по аторам и книгам

При создании поисковой БД во время загрузки и парсинга .inpx-файла, имеется возможность
отфильтровать авторов и книги, задав определенные критерии. Для этого небходимо создать
в рабочей директории (там же, где `config.json`) файл `filter.json` следующего вида:
```json
{
  "info": {
    "collection": "Новое название коллекции",
    "structure": "",
    "version": "1.0.0"
  },
  "filter": "(r) => r.del == 0",
  "includeAuthors": ["Имя автора 1", "Имя автора 2"],
  "excludeAuthors": ["Имя автора"]
}
```
При создании поисковой БД, авторы и книги из `includeAuthors` будут добавлены, а из `excludeAuthors` исключены.
Использование совместно `includeAuthors` и `excludeAuthors` имеет мало смысла, поэтому для включения
определенных авторов можно использовать только `includeAuthors`:
```json
{
  "info": {
    "collection": "Новое название коллекции"
  },
  "includeAuthors": ["Имя автора 1", "Имя автора 2"]
}
```
Для исключения:
```json
{
  "info": {
    "collection": "Новое название коллекции"
  },
  "excludeAuthors": ["Имя автора 1", "Имя автора 2"]
}
```

Параметр `filter` используется для более гибкой фильтрации по атрибутам записей из .inpx.
Уберем все записи, помеченные как удаленные и исключим "Имя автора 1":
```json
{
  "info": {
    "collection": "Новое название коллекции"
  },
  "filter": "(inpxRec) => inpxRec.del == 0",
  "excludeAuthors": ["Имя автора 1"]
}
```
Использование `filter` небезопасно, т.к. позволяет выполнить произвольный js-код внутри программы,
поэтому запуск приложения в этом случае должен сопровождаться дополнительным параметром командной строки `--unsafe-filter`.
Названия атрибутов inpxRec соответствуют названиям в нижнем регистре из структуры structure.info в .inpx-файле.
<a id="https" />

### Настройка https с помощью nginx
Проще всего настроить https с помощью certbot и проксирования в nginx (пример для debian-based linux):

```sh
#ставим nginx
sudo apt install nginx
```
```
#правим конфиг nginx
server {
  listen 80;
  server_name <имя сервера>;
  set $inpx_web http://127.0.0.1:12380;

  client_max_body_size 512m;
  proxy_read_timeout 1h;

  location / {
    proxy_pass $inpx_web;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```
```sh
#загружаем новый конфиг
sudo service nginx reload
```
Далее следовать инструкции установки https://certbot.eff.org/instructions?ws=nginx&os=debianbuster

<a id="build" />

### Сборка проекта
Сборка только в среде Linux.
Необходима версия node.js не ниже 16.

```sh
git clone https://github.com/bookpauk/inpx-web
cd inpx-web
npm i
```

#### Для платформы Windows
```sh
npm run build:win
```

#### Для платформы Linux
```sh
npm run build:linux
```

Результат сборки будет доступен в каталоге `dist/linux|win` в виде исполнимого (standalone) файла.

<a id="development" />

### Разработка
```sh
npm run dev
```

Связаться с автором проекта: [bookpauk@gmail.com](mailto:bookpauk@gmail.com)