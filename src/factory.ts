import { ContextImpl } from './impl/contextImpl';
import { Context } from './index';

function getContext(): Context {
  return new ContextImpl();
}

export { getContext };
