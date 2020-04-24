# :seedling: React-sprout

A suspense ready react router

## Installation

```
npm install react-sprout
```

## Basic usage

The default export is a function that creates a Router component to be used in your React application.

```javascript
import React from 'react';
import Routes from 'react-sprout';
import ReactDom from 'react-dom';

const Router = Routes(
  <ParentComponent path="parent">
    <ChildComponent path="child" />
  </ParentComponent>,
);

ReactDom.render(<Router />, document.body);
```

## Route elements

The router renders a subset of the elements that were given to it. It selects from sibling elements, the sibling best matching the location. Or no sibling at all, if no element matched the location.

```javascript
<ParentComponent path="parent">
  <ChildAComponent path="childA" />
  <ChildBComponent path="childB" />
</ParentComponent>
```

When the current location is `/parent/childA`, the router will not render `<ChildBComponent />` as `<ChildAComponent />` with its `childA` path, was a better match.
So the router would effectively render

```javascript
<ParentComponent>
  <ChildAComponent />
</ParentComponent>
```

When the current location is `/parent`, the router will not render `<ChildAComponent />` or `<ChildBComponent />` as they both did not match.
So the router would effectively only render the `<ParentComponent />`

```javascript
<ParentComponent />
```

The element `<ParentComponent />` would always render when the first segment of the current location is `parent`. It should render what is common to all routes starting with `/parent`.
When a `ChildComponent` also matched the location, it is given to `ParentComponent` as a child, and `ParentComponent` could decide if and where to render it by using `props.children`.

```javascript
function ParentComponent(props) {
  return (
    <div>
      <h1>Parent</h1>
      {props.children}
    </div>
  );
}
```

## Strict and loose matching

### Strict

Route elements that do not have any children routes, are matched very strictly to the current location.

The route element `<Component path="a" />` will NOT match with `/a/` or `/a/b`. It will match only with `/a`. 

The route element `<Component path="a/" />` will NOT match with `/a` or `/a/b`. It matches the trailing slash path `/a/`.

The route element `<Component path="a/*" />` will NOT match with `/a` or `/a/`. It matches the paths that have more segments after `/a/`, like `/a/b`.

So instead of matching all routes, `<Component path="*" />` will only match routes that have at least 1 segment!
If you want to match all routes, you can omit the `path` prop.

### Loose

Route elements that have children routes, are matched more loosely to the current location.

Here `<ParentComponent>` will render when the location is `/parent`, `/parent/` or `/parent/a` or even `/parent/a/b`.

```javascript
<ParentComponent path="parent">
  <ChildComponent path="child" />
</ParentComponent>
```

Specifying the path property with a trailing slash, prevents the route from matching with the path `/parent`.
So `<ParentComponent>` will render when the path is `/parent/` or `/parent/a` or even `/parent/a/b`.

```javascript
<ParentComponent path="parent/">
  <ChildComponent path="child" />
</ParentComponent>
```

Specifying the path property with an asterisk, prevents the route from matching with the paths `/parent` and `/parent/`.
It needs more segments to match. So it will match `/parent/a` and even `/parent/a/b`. 

```javascript
<ParentComponent path="parent/*">
  <ChildComponent path="child" />
</ParentComponent>
```

## Trailing slashes

The `/` always matches the path with the trailing slash.
The `.` always matches the path without the trailing slash.

```javascript
<Projects path="projects">
  <ProjectsIndex path="." /> // will match only with /projects
  <ProjectsIndex path="/" /> // will match only with /projects/
</ParentComponent>
```

## Params

You can use parameters in your path properties for matching a set of locations.

```javascript
<Component path="blog/:year/:month/:day" />
```

There is a `useParams` hook for accessing the matched values of these parameters.

```javascript
import { useParams } from 'react-sprout';

function Component(props) {
  let { year, month, day } = useParams();

  let date = `${year}-${month}-${day}`;

  return <time datetime={date}>{date}</time>;
}
```

## Splats

Whether you specified your path with an `*` or not. The part of the path that was not matched is called the splat.
There is a `useSplat` hook for this unmatched part of the url, and it is split into an array.

```javascript
<Admin path="admin">
  <Posts path="posts" />
  <Topics path="topics" />
</Admin>
```

When the location is `/admin/posts/1`, the `Admin` component can use the splat to know that a `posts` followed in the location pathname.

```javascript
import { useSplat } from 'react-sprout';

function Admin(props) {
  let [section] = useSplat();

  return (
    <div>
      <Menu>
        <Menuitem selected={section === 'posts'}>Posts</Menuitem>
        <Menuitem selected={section === 'topics'}>Topics</Menuitem>
      </Menu>
      <section>{props.children}</section>
    </div>
  );
}
```

## History and location

React-sprout comes with it's own `location` and `history` objects to manage your routing needs. They have the same API as the `location` and `history` of the browser, so you will feel right at home. You can access them with the `useLocation` and `useHistory` hooks.

```javascript
import { useHistory } from 'react-sprout';

function Component() {
  let history = useHistory();
  let location = useLocation();

  function handleBack() {
    history.back();
  }

  function handleReload() {
    location.reload()
  }

  function handleForward() {
    history.forward()
  }

  return <div>
    <h1>{location.pathname}</h1>
    <button onClick={handleBack}>Back</button>
    <button onClick={handleReload}>Reload</button>
    <button onClick={handleForward}>Forward</button>
  </div>
}
```

The history has all the same functions as your normal browser history object (go, back, forward, pushState, replaceState, ...)
The react-sprout history also has one extra convenience function `navigate(url, { replace, state, title, sticky }`, which is a handy replacement for `pushState(state, title, url)` and `replaceState(state, title, url)`. For more info about the sticky option, see the `Sticky navigation` part further in this document. A `useNavigate` hook shortcut is available for this `navigate` function if your component does not need the whole `history` object.

```javascript
import { useNavigate } from 'react-sprout';

function Component() {
  let navigate = useNavigate();

  function handleClick() {
    navigate('/to/some/url');
  }

  return <button onClick={handleClick}>Take me to some url</button>;
}
```

which is equivalent to

```javascript
import { useHistory } from 'react-sprout';

function Component() {
  let history = useHistory();

  function handleClick() {
    history.navigate('/to/some/url');
  }

  return <button onClick={handleClick}>Take me to some url</button>;
}
```

## Fragments

You can use fragments `<>` to specify siblings at the highest level of your route hierarchy.

```javascript
const Router = Routes(
  <>
    <About path="about" />
    <div path="posts">
      <Post path=":id" />
      <PostEdit path=":id/edit" />
      <PostCreate path="create" />
      <PostOverview path="." />
    </div>
  </>,
);
```

## Redirects

You can use a `<Redirect path="..." to="..." />` in your routes to redirect to another location. 
This `<Redirect />` should not be used in your components, but can be used in your route config. 

Here's an example to redirect from a deprecated location `/users/me` to `/profile`.

```javascript
import Routes, { Redirect } from 'react-sprout'

const Router = Routes(
  <>
    <Users path="users">
      <User path=":id" />
    </Users>
    <Profile path="profile" />
    <Redirect path="users/me" to="profile" />
  </>
)
```

Another example to prevent locations with a trailing `/`.

```javascript
import Routes, { Redirect } from 'react-sprout'

const Router = Routes(
  <Users path="users">
    <User path=":id" />
    <UserIndex path="." />
    <Redirect path="/" to="." />
  </Users>
)
```

Do not forget that `<Redirect />` elements have no children, and thus are matched strictly to the location (see `strict` and `loose` matching earlier in the document).
So if you want to redirect a location, you may need to be very specific with all occurences that you want to be redirected.

```javascript
import Routes, { Redirect } from 'react-sprout'

const Router = Routes(
  <Users path="users">
    <User path=":id" />
    <UserIndex path="." />
    <UserIndex path="/" />
  </Users>
  <Redirect path="people" to="users" />
  <Redirect path="people/" to="users" />
  <Redirect path="people/*" to="users/*" />
)
```

As you can see in the previous example where splats are used, splats and params are fully interpolated into the `to` prop of the `<Redirect />`.

This allows redirecting a set of locations 

```javascript
<Redirect path="people/:id/*" to="users/:id/*" />
```

## Links

A `<Link>` element is like the native `<a>` tag, but uses the react-sprout `history` to do navigation.

```javascript
function Menu() {
  return (
    <div>
      <Link to="/blog" />
      <Link to="/about" />
      <Link to="../some/relative/url" state={{ prop: 'value' }} replace={true} sticky={true} />
    </div>
  );
}
```

## Adding props to a child route

The child route is given as `props.children` to the parent route. If you however want to render the child route with some extra props,
the `<Child />` component is there to help. It also renders the child route, but you can pass it the props you want.

```javascript
import Routes, { Child, useParams } from 'react-sprout';

const Router = Routes(
  <ParentComponent path="/user/:id">
    <ChildComponent />
  </ParentComponent>,
);

function ParentComponent(props) {
  let { id } = useParams()

  return (
    <div>
      <h1>Parent</h1>
      <Child userId={id} />
    </div>
  );
}

function ChildComponent(props) {
  // Here props.userId will be the :id param of the parent path
}
```

## Suspense

If you want to make use of the suspense features in react and this router, you should

-   use the experimental version of react and react-dom by `npm install react@experimental react-dom@experimental`
-   wrap your application with a `<Suspense />` component in case the router suspends a transition to a new location
-   start your render with the concurrent API of react-dom

```javascript
import React from 'react'
import Routes from 'react-sprout'
import ReactDom from 'react-dom'

const Router = Routes(
  <ParentComponent path="parent">
    <ChildComponent path="child" />
  </ParentComponent>
)

function Application() {
  <Suspense fallback="loading...">
    <Router />
  </Suspense>
}

ReactDom.createRoot(document.body).render(<Application >)
```

## Data fetching

If your route needs some data to be fetched asynchronously before the route is shown, you can specify an async function as a data property to your route. The parameters of the matched path is the argument to your async function, allowing you to fetch the correct data based on the parameters of your route.

```javascript
import Routes from 'react-sprout';

async function fetchPost({ id }) {
  let response = await fetch(`/posts/${id}`);
  let result = response.json();
  return result;
}

async function fetchPosts() {
  let response = await fetch(`/posts`);
  let result = response.json();
  return result;
}

const Router = Routes(
  <Posts path="posts">
    <Post path=":id" data={fetchPost} />
    <PostOverview path="/" data={fetchPosts} />
  </Posts>,
);
```

When your component will be rendered because its' path matched the location, react-sprout will fetch your data before rendering your route element.
For accessing the data that react-sprout fetched for you, use the hook `useData`.

```javascript
import { useData } from 'react-sprout';

function Post() {
  let post = useData();

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

If your data is still pending, `useData` will suspend the transition to the route.
After your data fetch is complete, rendering will resume and the transition to the new location will complete.

## Sticky navigation

When navigating to a new location with `navigate`, there is a `sticky` option to allow the new location to load in the background. The current location will be kept on the screen, until the data of the new location is loaded. When the new location is ready to be displayed, the navigation will happen and the url will be updated. When using sticky navigation, you should show an indicator to your users that the new route is loading in the background. The `usePending` hook returns whether a navigation is still pending in the background or not. The maximum amount of time that a navigation stays in the background, can be specified by a `timeoutMs` prop on the router element. The default is 4000ms. After this timeout, the new location will be shown even if it was not ready.

```javascript
import React from 'react'
import ReactDom from 'react-dom'
import Routes, { usePending, useParams, useNavigate } from 'react-sprout'

function Post()  {
  let post = useData()
  let pending = usePending()
  let navigate = useNavigate()

  function handleNext() {
    navigate(id + 1, { sticky: true })
  }

  return <section>
    <article>{post.content}</article>
    <span>{pending && 'Loading next post'}</span>
    <button onClick={handleNext}>Next post</button>
  </section>
}

async function fetchPost({ id }) {
  let response = await fetch(`/posts/${id}`);
  let result = response.json();
  return result;
}

const Router = Routes(
  <Post path="posts/:id" data={fetchPost} />
)

function Application() {
  return <Suspense fallback="loading...">
    <Router timeoutMs={5000} />
  </Suspense>
}

ReactDom.createRoot(document.body).render(<Application />)
```

## Router options

When creating the router, you could also pass an options object as the first argument. The following options can be used:

-   location: the initial location of the router, defaults to the browser's current location. Can be used for server side rendering, to set the path to the location of the incoming request.
-   base: the part of the location pathname that should not be included in the path matching. Can be used if you want your application in a subroute without changing your router paths.

```javascript
const Router = Routes({ location: 'application/a/static/path', base: 'application' }, 
  <Component path="a/static/path" />
);
```

## Resources

There is a `useData` hook for getting the route data. This will suspend rendering if the data is not ready.
There is also a `useResource` hook which gets the underlying resource for the data, and does not suspend rendering.

If you ever need to give the data of your route to another component, you can pass the resource as a prop. The other component could then access the data with the same `useData` hook, but pass the resource as the first argument.

```javascript
import Routes, { Child } from 'react-sprout';

const Router = Routes(
  <ParentComponent path="parent" data={fetchParentData}>
    <ChildComponent path="child" data={fetchChildData} />
  </ParentCompoent>,
);

function ParentComponent(props) {
  let resource = useResource();

  return <Child resource={resource} />;
}

function ChildComponent(props) {
  let { resource } = props;

  let childData = useData();
  let parentData = useData(resource);

  return (
    <div>
      <span>{childData.prop}</span>
      <span>{parentData.prop}</span>
    </div>
  );
}
```

This method is to be preferred over passing the data itself as a prop, because then the `ParentComponent` must use `useData` to get the data before passing it to it's child. This means the `ParentComponent` suspends rendering and only on completion of the data fetching, will pass the data to it's child.

Passing the resource instead allows the `ParentComponent` to not suspend, but let the `ChildComponent` do the suspending with `useData`. If there is a `<Suspense>` boundary between Parent and Child, it will be used when the child suspends. If the Parent did the suspending, that `<Suspense>` boundary could not have been activated.

## Route config

```
If you want to know how react-sprout works, read on.
If you are just interested in using it, you can skip this last part of the readme.
```

When you create the router with a React element, it converts the React element tree to a route config array.

```javascript
const Router = Routes(
  <ParentComponent path="parent" data={fetchSomeData}>
    <ChildComponent path="child" />
  </ParentComponent>,
);
```

Would convert the React element tree to

```javascript
[
  {
    path: 'parent',
    data: fetchSomeData,
    render: ParentComponent,
    routes: [
      {
        path: 'child',
        render: ChildComponent,
      },
    ],
  },
];
```

Every element becomes a route with 4 possible attributes:

-   path: the path to be used in matching
-   data: the async function to be used for data loading
-   render: the react component to render this route with
-   routes: the child routes of this route

React-sprout also allows you to pass such a configuration object directly, instead of the React elements, for advanced use cases.

```javascript
const Router = Routes([
  {
    path: 'parent',
    data: fetchSomeData,
    render: ParentComponent,
    routes: [
      {
        path: 'child',
        render: ChildComponent,
      },
    ],
  },
]);
```
