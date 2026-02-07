import { CompanyDetails, InvoiceData } from '../../types';

interface InvoiceTemplateProps {
  company: CompanyDetails;
  data: InvoiceData;
}

export default function InvoiceTemplate({ company, data }: InvoiceTemplateProps) {
  const productsPerPage = 10;
  const chunks = [];
  for (let i = 0; i < data.products.length; i += productsPerPage) {
    chunks.push(data.products.slice(i, i + productsPerPage));
  }
  if (chunks.length === 0) chunks.push([]);

  return (
    <div className="flex flex-col bg-gray-100 text-black gap-8 print:gap-0 print:bg-white pb-10 print:pb-0">
      {chunks.map((chunk, pageIndex) => {
        const isLastPage = pageIndex === chunks.length - 1;
        const pageSubtotal = chunk.reduce((sum, p) => sum + p.amount, 0);

        return (
          <div
            key={pageIndex}
            className="w-[210mm] min-h-[297mm] mx-auto bg-white text-black border-2 border-black text-xs font-serif flex flex-col relative"
            style={{ pageBreakAfter: 'always' }}
          >
            {/* HEADER SECTION */}
            <div className="flex items-center h-[120px] border-b-2 border-black">
              <div className="w-[150px] flex items-center justify-center h-full">
                <div className="w-24 h-24 relative flex items-center justify-center">
                  {company.logo ? (
                    <img src={company.logo} className="w-full h-full object-contain" alt="Logo" />
                  ) : (
                    <div className="w-20 h-20 border-2 border-[#d4af37] rounded-full flex items-center justify-center relative bg-white z-10">
                      <span className="text-4xl font-bold text-[#d4af37] font-serif uppercase">VK</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
                <h1 className="text-4xl font-bold text-[#22c55e] tracking-wider font-serif uppercase">{company.name}</h1>
                <p className="text-xs font-bold mt-1 text-gray-700">Complete Technology Solution Provider</p>
              </div>

              <div className="w-[150px] h-full flex flex-col items-end justify-start p-4 text-right">
                <h2 className="text-xl font-bold text-[#3b82f6] tracking-widest uppercase">Invoice</h2>
                <p className="text-[10px] font-bold text-gray-400 mt-1">Page {pageIndex + 1} of {chunks.length}</p>
              </div>
            </div>

            {/* INFO GRID */}
            <div className="flex border-b-2 border-black h-[170px]">
              <div className="w-[30%] border-r border-black p-2 flex flex-col text-[11px] leading-snug">
                <h3 className="font-bold text-sm mb-1 uppercase text-blue-800">Bill From</h3>
                <div className="font-bold text-xs">{company.name}</div>
                <div className="whitespace-pre-line">{company.address}</div>
                <div className="mt-1 font-bold">Phone No: {company.mobile}</div>
                {company.gstin && <div className="font-bold">GSTIN: {company.gstin}</div>}
              </div>

              <div className="w-[35%] border-r border-black p-2 flex flex-col gap-1 text-[11px] leading-snug">
                <h3 className="font-bold text-sm mb-1 uppercase text-blue-800">Bill To</h3>
                <div className="font-bold uppercase break-words w-full">{data.customerName}</div>
                <div className="break-words w-full whitespace-pre-wrap text-gray-700">{data.customerAddress}</div>
                <div className="mt-auto font-bold">Phone No: {data.customerPhone}</div>
              </div>

              <div className="flex-1 flex flex-col text-[11px]">
                <div className="flex-1 border-b border-black p-1 px-2 flex flex-col justify-center gap-0.5">
                  <div className="flex justify-between font-bold"><span>INV NO</span><span>: {data.invoiceNumber}</span></div>
                  <div className="flex justify-between font-bold"><span>DATE</span><span>: {data.date}</span></div>
                  <div className="flex justify-between font-bold"><span>TIME</span><span>: {data.time}</span></div>
                </div>
                <div className="flex-1 p-1 px-2 flex flex-col justify-center gap-0.5">
                  <div className="flex justify-between font-bold"><span>DUE DATE</span><span>: {data.dueDate || '-'}</span></div>
                  <div className="flex justify-between font-bold"><span>PAY MODE</span><span className="uppercase">: {data.paymentMode}</span></div>
                  <div className="flex justify-between font-bold"><span>BALANCE</span><span className="text-red-600">: ₹{(data.balance || 0).toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            {/* ITEMS TABLE HEADER */}
            <div className="flex border-b-2 border-black bg-[#1e3a8a] text-white font-bold text-center h-[35px] items-center text-[11px]">
              <div className="w-[8%] py-1 border-r border-white h-full flex items-center justify-center">S.No.</div>
              <div className="flex-1 py-1 border-r border-white text-left px-2 h-full flex items-center justify-center">Description</div>
              <div className="w-[10%] py-1 border-r border-white h-full flex items-center justify-center">Qty</div>
              <div className="w-[12%] py-1 border-r border-white h-full flex items-center justify-center">Price</div>
              <div className="w-[8%] py-1 border-r border-white h-full flex items-center justify-center">Dis %</div>
              <div className="w-[15%] py-1 border-white h-full flex items-center justify-center">Amount</div>
            </div>

            {/* ITEMS BODY */}
            <div className="flex-1 relative flex flex-col min-h-[300px]">
              <div className="flex-1">
                {chunk.map((p, i) => {
                  const globalIndex = pageIndex * productsPerPage + i;
                  return (
                    <div key={i} className="flex border-b border-gray-300 text-[11px] min-h-[30px]">
                      <div className="w-[8%] p-1 text-center border-r border-black flex items-center justify-center font-bold">{globalIndex + 1}</div>
                      <div className="flex-1 p-1 px-2 border-r border-black font-semibold flex items-center">{p.description}</div>
                      <div className="w-[10%] p-1 text-center border-r border-black flex items-center justify-center">{p.qty}</div>
                      <div className="w-[12%] p-1 text-right border-r border-black px-2 flex items-center justify-end">{p.rate}</div>
                      <div className="w-[8%] p-1 text-center border-r border-black flex items-center justify-center">{p.discountPercent || '0'}%</div>
                      <div className="w-[15%] p-1 text-right border-black font-bold px-2 flex items-center justify-end">₹{p.amount}</div>
                    </div>
                  );
                })}
              </div>

              {/* Vertical Lines Overlay */}
              <div className="absolute inset-0 pointer-events-none flex opacity-30">
                <div className="w-[8%] border-r border-black h-full"></div>
                <div className="flex-1 border-r border-black h-full"></div>
                <div className="w-[10%] border-r border-black h-full"></div>
                <div className="w-[12%] border-r border-black h-full"></div>
                <div className="w-[8%] border-r border-black h-full"></div>
                <div className="w-[15%] h-full"></div>
              </div>
            </div>
            {/* FOOTER SECTION */}
            <div className="mt-auto border-t-2 border-black flex flex-col">
              {/* Bank & Totals Table */}
              <div className="flex border-b border-black">
                <div className="w-1/2 border-r border-black p-2 bg-gray-50 flex flex-col justify-center">
                  {isLastPage && (
                    <>
                      <h3 className="font-bold text-[11px] mb-1">Bank Details</h3>
                      <div className="grid grid-cols-[80px_1fr] text-[11px] font-medium leading-relaxed pl-1">
                        <span>Name</span><span>: {company.bankHolder || 'Vasanthakumar Palanivel'}</span>
                        <span>IFSC Code</span><span>: {company.ifsc}</span>
                        <span>Account No</span><span>: {company.accountNumber}</span>
                        <span>Bank</span><span>: {company.bankName}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="w-1/2">
                  <table className="w-full text-[11px] font-bold">
                    <tbody>
                      <tr className="h-6 border-b border-gray-100">
                        <td className="px-2">Subtotal</td>
                        <td className="px-2 text-right">₹{isLastPage ? data.subTotal.toFixed(2) : pageSubtotal.toFixed(2)}</td>
                      </tr>
                      {isLastPage && (
                        <>
                          {data.totalGst > 0 && (
                            <>
                              <tr className="h-6 border-b border-gray-100">
                                <td className="px-2 text-gray-500 uppercase">GST ({data.gstRate}%)</td>
                                <td className="px-2 text-right">₹{(data.totalGst || 0).toFixed(2)}</td>
                              </tr>
                              <tr className="h-6 border-b border-gray-100">
                                <td className="px-2 text-gray-500 uppercase">SGST ({data.gstRate / 2}%)</td>
                                <td className="px-2 text-right">₹{data.sgst.toFixed(2)}</td>
                              </tr>
                              <tr className="h-6 border-b border-gray-100">
                                <td className="px-2 text-gray-500 uppercase">CGST ({data.gstRate / 2}%)</td>
                                <td className="px-2 text-right">₹{data.cgst.toFixed(2)}</td>
                              </tr>
                            </>
                          )}
                          <tr className="h-6 border-b border-gray-100">
                            <td className="px-2 text-gray-500 uppercase">Round Off</td>
                            <td className="px-2 text-right">₹{data.roundOff}</td>
                          </tr>
                          <tr className="h-8 bg-[#93c5fd] text-blue-900 border-b border-black">
                            <td className="px-2 text-base font-black">GRAND TOTAL</td>
                            <td className="px-2 text-right text-base font-black">₹{Number(data.grandTotal).toFixed(2)}</td>
                          </tr>
                          <tr className="h-7 bg-green-50">
                            <td className="px-2 text-green-800 uppercase">PAID AMOUNT</td>
                            <td className="px-2 text-right text-green-800 font-black">₹{data.paidAmount}</td>
                          </tr>
                          <tr className="h-7 bg-red-50">
                            <td className="px-2 text-red-800 uppercase">BALANCE</td>
                            <td className="px-2 text-right text-red-800 font-black">₹{(data.balance || 0).toFixed(2)}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Words, QR, Terms */}
              {isLastPage && (
                <div className="flex border-b border-black">
                  <div className="flex-1 p-2 border-r border-black">
                    <p className="font-bold text-[10px] text-gray-500 mb-1 leading-none uppercase">Amount in Words</p>
                    <p className="font-bold text-xs uppercase underline">{data.amountInWords} Only</p>
                    <div className="mt-4">
                      <p className="font-bold text-[10px] text-gray-500 mb-1 leading-none uppercase">Terms & Conditions</p>
                      <ul className="text-[9px] list-disc pl-4 space-y-0.5 leading-tight">
                        <li>Goods once sold cannot be taken back or exchange.</li>
                        <li>Invoice Once made cannot be Modified or Cancelled.</li>
                        <li>Repairs/ Replacement subject to manufacture Policy.</li>
                        <li>Warranty void on product if Mishandled/ Burnt/ Physically.</li>
                        <li>Credit period 2 Days only</li>
                      </ul>
                    </div>
                  </div>
                  <div className="w-[150px] p-2 flex flex-col items-center justify-center">
                    <p className="text-[9px] font-bold mb-1">SCAN & PAY</p>
                    <div className="w-20 h-20 border border-black p-0.5 mb-1">
                      {company.qrCode ? <img src={company.qrCode} className="w-full h-full" alt="QR" /> : <img src="/payment-qr.png" className="w-full h-full object-contain" alt="QR" />}
                    </div>
                    <p className="text-[8px] font-bold text-gray-600">{company.upiId}</p>
                  </div>
                </div>
              )}

              {/* Signature */}
              <div className="flex h-[110px]">
                <div className="w-1/2 p-2 flex items-center">
                  <p className="text-[10px] italic text-gray-400">{isLastPage ? 'Thank you for your business!' : 'Continued on next page...'}</p>
                </div>
                <div className="w-1/2 p-2 flex flex-col items-center justify-between">
                  <p className="text-[10px] font-bold uppercase">For {company.name}</p>
                  <div className="h-14 flex items-center justify-center">
                    {isLastPage ? (
                      <img src="/authorized-signature.png" alt="Signature" className="h-12 object-contain" />
                    ) : (
                      <div className="h-12" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold border-t border-black w-full text-center pt-1">Authorized Signature</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
