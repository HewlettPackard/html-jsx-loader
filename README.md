# html-jsx-loader

Webpack loader module that exports HTML as [React](http://facebook.github.io/react/) JSX class.

## Installation

```shell
npm i --save-dev html-jsx-loader
```

NOTE: You will also need to have babel and the babel react and es2015 presets installed, but you probably already do.

## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

## Examples

Add the **html-jsx-loader** to your Webpack configuration:

``` javascript
{
	...
	module: {
		loaders: [
			{ test: /\.htm$/, loader: 'babel?presets[]=react,presets[]=es2015!html-jsx-loader'}
		]},
		resolve: {
			extensions: ['', '.js', '.htm']
		}
	}
	...
}
```

Now you can write raw HTML (e.g. Introduction.htm) and webpack will automatically convert the content of this file to a React component.

Finally, you can reference this component in your JavaScript code as follows:

``` javascript
	var Introduction = require('./Introduction'); 

	//Introduction is not HTML but ReactJS class.
```

So, if you have an Introduction.html file like this:

```html
<h1>Hello</h1>
<p>This is a greeting</p>
```

It is equivalent to saying

```javascript
var Introduction = React.createClass({
	render() {
		return (
			<div>
				<h1>Hello</h1>
				<p>This is a greeting</p>
			</div>
		)
	}
})

```

## Advanced Usage

### Grouping tags

If you would like the **html-jsx-loader** to group tags into separate react components, use the query **group=true**:

``` javascript
{
	...
	module: {
		loaders: [
			{ test: /\.htm$/, loader: 'jsx-loader!imports?React=react!html-jsx-loader?group=true'}
		]},
		resolve: {
			extensions: ['', '.js', '.htm']
		}
	}
	...
}
```

Then you can refer to your components like this:

``` javascript
	var Introduction = require('./Introduction');
	var Header = Introduction.Header;
	var Section = Introduction.Section;

	//Section will contain all <section /> tags
```

### React Router integration

If you would like the **html-jsx-loader** to parse **a** tags to React Router **Link** tags, specify data-* inside your markup and the conversion will be done automatically:


``` html
<html>
	<body>
		<a data-style="[color: 'white']" data-activeStyle="[color: 'red']" data-to="user" data-params="[userId: user.id]" data-query="[foo: bar]">[user.name]</a>
	</body>
</html>
```

``` javascript
{
	...
	module: {
		loaders: [
			{ test: /\.htm$/, loader: 'babel!html-jsx-loader'}
		]},
		resolve: {
			extensions: ['', '.js', '.htm']
		}
	}
	...
}
```

The only required attribute is **data-to**. If not provided, the current **a** tag will remain unchanged.

### Variable Replacement

If you would like the **html-jsx-loader** to replace a custom variable inside your HTML, create a variable in the format of \_\_VARIABLE_NAME\_\_ and add the desired replacement value as a query attribute to the loader. For Example:

``` html
<html>
  <body>
    <img src"__LOCATION__/image.png" />
  </body>
</html>
```

``` javascript
{
  ...
  module: {
    loaders: [
      { test: /\.htm$/, loader: 'babelhtml-jsx-loader?__LOCATION__=server'}
    ]},
    resolve: {
      extensions: ['', '.js', '.htm']
    }
  }
  ...
}
```

Then, the expected **src** path of the image tag will be: 'server/image.png'. If the query is not specified, the corresponding variable in the HTML will not change.

