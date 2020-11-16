[path to file](files/sample-file.txt)

<img src="images/sample-image.png" />
<img src="images/sample-image.jpeg" />
<img src="images/sample-image.jpg" />
<a href="files/sample-file.txt">link to file</a>
<a href="http://example.com/">Link to example.com</a>

![some svg image](images/sample-image.svg)
![some gif image](images/sample-image.gif)
![some png image](images/sample-image.png)
![some jpg image](images/sample-image.jpg)
![some jpeg image](images/sample-image.jpeg)
![some absolute image](https://google.com/images/sample-image.gif)

<video controls="controls" autoplay loop>
  <source type="video/mp4" src="videos/sample-video.mp4"/>
  <p>Your browser does not support the video element.</p>
</video>

![sample][1]

[1]: images/sample-image.png

```html{2}
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hello World!</title>
  </head>
  <body>
    <h1>Hello World!</h1>
  </body>
</html>
```

[path to file](files/sample-file.txt)

<img src="images/sample-image.png" />
<img src="images/sample-image.jpeg" />
<img src="images/sample-image.jpg" />
<a href="files/sample-file.txt">link to file</a>
<a href="http://example.com/">Link to example.com</a>

![some svg image](images/sample-image.svg)
![some gif image](images/sample-image.gif)
![some png image](images/sample-image.png)
![some jpg image](images/sample-image.jpg)
![some jpeg image](images/sample-image.jpeg)
![some absolute image](https://google.com/images/sample-image.gif)

<video controls="controls" autoplay loop>
  <source type="video/mp4" src="videos/sample-video.mp4"/>
  <p>Your browser does not support the video element.</p>
</video>

![sample][1]

[1]: images/sample-image.png

```html{1,3-4,8}
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hello World!</title>
  </head>
  <body>
    <h1>Hello World!</h1>
  </body>
</html>
```

[path to file](files/sample-file.txt)

<img src="images/sample-image.png" />
<img src="images/sample-image.jpeg" />
<img src="images/sample-image.jpg" />
<a href="files/sample-file.txt">link to file</a>
<a href="http://example.com/">Link to example.com</a>

![some svg image](images/sample-image.svg)
![some gif image](images/sample-image.gif)
![some png image](images/sample-image.png)
![some jpg image](images/sample-image.jpg)
![some jpeg image](images/sample-image.jpeg)
![some absolute image](https://google.com/images/sample-image.gif)

<video controls="controls" autoplay loop>
  <source type="video/mp4" src="videos/sample-video.mp4"/>
  <p>Your browser does not support the video element.</p>
</video>

![sample][1]

[1]: images/sample-image.png

```tsx{13-19}
export default () => {
  // register current used theme
  const [theme, setTheme] = React.useState(themes.light);

  // handle the radio changes
  const handleChange = ({ target }) => {
    // based on the radio value, toggle to the correct theme
    return setTheme(themes[target.value]);
  };

  return (
    <ThemeProvider value={theme}>
      <Button>I am styled by theme context!</Button>
      <form onChange={handleChange}>
        <p>Please select your theme:</p>
        <input type="radio" id="light" name="theme" value="light" />
        <label for="light">Light</label>
        <input type="radio" id="dark" name="theme" value="dark" />
        <label for="dark">Dark</label>
      </form>
    </ThemeProvider>
  );
};
```

[path to file](files/sample-file.txt)

<img src="images/sample-image.png" />
<img src="images/sample-image.jpeg" />
<img src="images/sample-image.jpg" />
<a href="files/sample-file.txt">link to file</a>
<a href="http://example.com/">Link to example.com</a>

![some svg image](images/sample-image.svg)
![some gif image](images/sample-image.gif)
![some png image](images/sample-image.png)
![some jpg image](images/sample-image.jpg)
![some jpeg image](images/sample-image.jpeg)
![some absolute image](https://google.com/images/sample-image.gif)

<video controls="controls" autoplay loop>
  <source type="video/mp4" src="videos/sample-video.mp4"/>
  <p>Your browser does not support the video element.</p>
</video>

![sample][1]

[1]: images/sample-image.png
