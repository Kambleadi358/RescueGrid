#include <iostream>
#include <vector>
using namespace std; void sortMerge(vector<int>&a){if(a.size()<2)return;int m=a.size()/2;vector<int>l(a.begin(),a.begin()+m),r(a.begin()+m,a.end());sortMerge(l);sortMerge(r);int i=0,j=0,k=0;while(i<(int)l.size()&&j<(int)r.size())a[k++]=l[i]<r[j]?l[i++]:r[j++];while(i<(int)l.size())a[k++]=l[i++];while(j<(int)r.size())a[k++]=r[j++];} // O(R log R), O(R)
int main(){vector<int>a={3,1,4,1,5};sortMerge(a);for(int x:a)cout<<x<<' ';}
