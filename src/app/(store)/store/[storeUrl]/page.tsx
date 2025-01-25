import ProductFilters from "@/components/store/browse-page/filters";
import ProductSort from "@/components/store/browse-page/sort";
import CategoriesHeader from "@/components/store/layout/categories-header/categories-header";
import Header from "@/components/store/layout/header/header";
import StoreDEetails from "@/components/store/store-page/store-details";
import StoreProducts from "@/components/store/store-page/store-products";
import { FiltersQueryType } from "@/lib/types";
import { getStorePageDetails } from "@/queries/store";

export default async function StorePage({
  params,
  searchParams,
}: {
  params: { storeUrl: string };
  searchParams: FiltersQueryType;
}) {
  const store = await getStorePageDetails(params.storeUrl);
  return (
    <>
      <Header />
      <CategoriesHeader />
      <div className="max-w-[1600px] mx-auto px-2 ">
        <StoreDEetails details={store} />
        <div className="mt-8 md:mt-14">
          <div className="flex ">
            <div className=" lg:top-16 left-2 md:left-4 mt-3">
              <ProductFilters queries={searchParams} />
            </div>
            <div className="pt-4 ">
              <div className="md:ml-5">
                <ProductSort />
              </div>
              <div className="-ml-6 md:ml-0">
                <StoreProducts
                  searchParams={searchParams}
                  store={params.storeUrl}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
