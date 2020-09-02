import Path from 'path';
import React from 'react';
import useLocation from '../hooks/use-location';
import useNavigate from '../hooks/use-navigate';

import { forwardRef } from 'react';

export default forwardRef(function Link(props, ref) {
	let { to, state, title, replace, sticky, onClick, ...other } = props;

	let location = useLocation();
	let navigate = useNavigate();

	let href = Path.resolve(location.pathname, `${to}`);

	function handleClick(event) {
		if (onClick) onClick(event);
		if (shouldNavigate(event)) {
			event.preventDefault();
			navigate(href, { replace, state, title, sticky });
		}
	}

	return <a ref={ref} href={href} onClick={handleClick} {...other} />;
});

function shouldNavigate(event) {
	let isLeftClick = event.button === 0;
	let hasModifierKey = event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
	return !event.defaultPrevented && !hasModifierKey && isLeftClick;
}
