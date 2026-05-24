import { Search, X } from "lucide-react";
import { publicPath } from "@/lib/public-path";

export default function SearchDialog() {
  return (
    <>
      <button className="icon-button" type="button" popoverTarget="site-search" aria-label="搜索资料">
        <Search aria-hidden="true" size={18} />
      </button>
      <div className="search-dialog" id="site-search" popover="auto" role="dialog" aria-label="搜索资料">
        <form action={publicPath("/search/")} method="get">
          <Search aria-hidden="true" size={22} />
          <input name="q" type="search" placeholder="搜索论文、博客、方法、工程实践" autoComplete="off" />
          <button className="icon-button subtle" type="button" popoverTarget="site-search" popoverTargetAction="hide" aria-label="关闭搜索">
            <X aria-hidden="true" size={18} />
          </button>
        </form>
        <div className="quick-searches">
          {["workflow", "评测", "代码生成", "可观测性"].map((item) => (
            <a key={item} href={publicPath(`/search/?q=${encodeURIComponent(item)}`)}>
              {item}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
