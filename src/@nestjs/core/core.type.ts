export interface ProviderObject {
  provide?: string | Function;
  useValue?: any;
  useClass?: new (...args: any[]) => any;
  useFactory?: (...args: any[]) => any;
  inject?: any[];
}

export type ProviderType = ProviderObject | Function;
