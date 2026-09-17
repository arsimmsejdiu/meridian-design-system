# @meridian/angular

Generated Angular directives. Do not hand-edit `src/generated` — it is produced
by `packages/components`' Stencil build and overwritten on every compile.

```ts
import { MeridianModule } from '@meridian/angular';

@NgModule({ imports: [MeridianModule] })
export class AppModule {}
```

`CUSTOM_ELEMENTS_SCHEMA` is not required: the generated directives give Angular
real types for every attribute, property and event.
